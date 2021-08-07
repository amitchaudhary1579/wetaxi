import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Validation } from '../../helper/validation';
import { PassengerService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router, ActivatedRoute } from '@angular/router';
import { FileValidator } from '../../helper/file-input.validator';
import { NgbDateParserFormatter, NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'view-passenger',
  templateUrl: './view-passenger.component.html',
})
export class ViewPassengerComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  action: string = 'view';
  position = 'bottom-right';
  viewPassengerForm: FormGroup;
  isSubmitted: boolean = false;
  extension: any;
  isImageExtensionError: Boolean = false;
  isImageSelected: Boolean = false;
  profilePhoto: any = {};
  countries: any;
  countryFlagUrl: any;
  passengerData: any = {};
  passenger_id: any;
  profilePhotoUrl: any;
  disabled: Boolean = true;

  constructor(
    config: NgbDatepickerConfig,
    private validation:Validation,
    private passengerService: PassengerService,
    private toastyService: ToastyService,
    private router: Router,
    private route: ActivatedRoute,
    private fileValidator: FileValidator,
    private ngbDateParserFormatter: NgbDateParserFormatter
  ) { 
    config.minDate = {year: 1900, month: 1, day: 1};
    config.maxDate = {year: (new Date()).getFullYear(), month: (new Date()).getMonth(), day: (new Date()).getDate()};
  }

  ngOnInit() {
    this.profilePhotoUrl = environment.profileImageUrl;
    this.getAllCountries();
    this.viewPassengerForm = new FormGroup({
      name: new FormControl("", [Validators.required, Validators.pattern(this.validation.alpha_numeric_space), Validators.minLength(2), Validators.maxLength(50)]),
      email: new FormControl("", [Validators.pattern(this.validation.email)]),
      dob: new FormControl("", [Validators.required]),
      countryCode: new FormControl("", [Validators.required]),
      phoneNumber: new FormControl("", [Validators.required, Validators.minLength(8), Validators.maxLength(16), Validators.pattern(this.validation.integer)]),
      profilePhoto: new FormControl("", [])
    });
    this.route.params.subscribe(params => {
      this.passenger_id = params.passenger_id;
    });
    this.getPassengerDetails();
  }

  onEdit() {
    this.action = 'edit';
    this.disabled = false;
  }

  getAllCountries() {
    this.loading = true;
    this.passengerService.getAllCountries().subscribe(
      respone => {
        this.loading = false;
        let resData = JSON.parse(JSON.stringify(respone));
        this.countries = resData.data.countries;
        this.countryFlagUrl = resData.data.countryFlagUrl;
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
  }

  onChangeMobileNumber() {
    let firstDigit = this.viewPassengerForm.value.phoneNumber.slice(0,1);
    if(firstDigit == 0) {
      this.viewPassengerForm.value.phoneNumber = this.viewPassengerForm.value.phoneNumber.slice(1,this.viewPassengerForm.value.phoneNumber.length);
      this.viewPassengerForm.patchValue({
       'phoneNumber': this.viewPassengerForm.value.phoneNumber
      })
    }
  }

  getPassengerDetails() {
    this.loading = true;
    let passengerData = {
      'passenger_id': this.passenger_id
    }
    this.passengerService.getPassengerDetails(passengerData).subscribe(
      respone => {
        this.loading = false;
        this.passengerData = respone.data;
        this.viewPassengerForm.setValue({
          name: this.passengerData.name,
          email: this.passengerData.email,
          dob: this.ngbDateParserFormatter.parse(this.passengerData.dob),
          countryCode: this.passengerData.countryCode,
          phoneNumber: this.passengerData.onlyPhoneNumber,
          profilePhoto: ''
        });
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
  }

  addToast(options) {
    if (options.closeOther) {
      this.toastyService.clearAll();
    }
    this.position = options.position ? options.position : this.position;
    const toastOptions: ToastOptions = {
      title: options.title,
      msg: options.msg,
      showClose: options.showClose,
      timeout: options.timeout,
      theme: options.theme,
      onAdd: (toast: ToastData) => {
      },
      onRemove: (toast: ToastData) => {
      }
    };

    switch (options.type) {
      case 'default': this.toastyService.default(toastOptions); break;
      case 'info': this.toastyService.info(toastOptions); break;
      case 'success': this.toastyService.success(toastOptions); break;
      case 'wait': this.toastyService.wait(toastOptions); break;
      case 'error': this.toastyService.error(toastOptions); break;
      case 'warning': this.toastyService.warning(toastOptions); break;
    }
  }


  onImageChange(e) {
    const vm = this;
    if (e.target.files.length > 0) {
      let file = e.target.files[0];
      if (file) {
        if (!this.fileValidator.validateImage(file.name)) {
          this.isImageExtensionError = true;
        } else {
          this.isImageSelected = true;
          this.isImageExtensionError = false;
          // get file extension
          this.extension = file.name.split(".").pop();
          let reader = new FileReader();
          reader.onload = (e: any) => {
            var image = new Image();
            image.src = e.target.result;
          };
          this.profilePhoto = file
        }
      }
    } else {
      this.profilePhoto = '';
      this.isImageSelected = false;
      this.isImageExtensionError = false;
    }
  }

  onDelete() {
    this.loading = true;
    let passengerData = {
      'passenger_id': this.passenger_id
    }
    this.passengerService.deletePassenger(passengerData).subscribe(
      next => {
        this.loading = false;
        if(next.status_code == 200) {
        } this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
        this.router.navigate(["/passenger/list-passenger"]);
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
  }

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.viewPassengerForm.valid && !this.isImageExtensionError) {
      this.loading = true;

      if(this.viewPassengerForm.value && !this.viewPassengerForm.value.onlyPhoneNumber) {
        if(this.viewPassengerForm.value.dob.month.toString().length <= 1) {
          this.viewPassengerForm.value.dob.month = '0' + this.viewPassengerForm.value.dob.month;
        }
        if(this.viewPassengerForm.value.dob.day.toString().length <= 1) {
          this.viewPassengerForm.value.dob.day = '0' + this.viewPassengerForm.value.dob.day;
        }
        this.viewPassengerForm.value.dob = this.viewPassengerForm.value.dob.year + '-' + this.viewPassengerForm.value.dob.month + '-' + this.viewPassengerForm.value.dob.day;
        this.viewPassengerForm.value.onlyPhoneNumber = this.viewPassengerForm.value.phoneNumber;
        this.viewPassengerForm.value.phoneNumber = this.viewPassengerForm.value.countryCode +  this.viewPassengerForm.value.phoneNumber;
      }

      this.viewPassengerForm.value.passenger_id = this.passenger_id;
      let params = this.viewPassengerForm.value;
      let formData: FormData = new FormData();
      for (let key in params) {
          formData.append(key, params[key]);
      }
      if(this.isImageSelected) {
        formData.append("profilePhoto", this.profilePhoto);
      }
      this.passengerService.editPassenger(formData)
        .subscribe(next => {
            this.loading = false;
            this.isSubmitted = false;
            if (next.status_code == 200) {
              this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
              this.router.navigate(["/passenger/list-passenger"]);
            } else {
              this.addToast({title:'Error', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
            }
          },
          error => {
            this.loading = false;
            this.isSubmitted = false;
            this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
          })
    }
  }

}

