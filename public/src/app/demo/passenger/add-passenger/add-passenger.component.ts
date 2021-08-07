import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Validation } from '../../helper/validation';
import { PassengerService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router } from '@angular/router';
import { FileValidator } from '../../helper/file-input.validator';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
@Component({
  selector: 'add-passenger',
  templateUrl: './add-passenger.component.html',
})
export class AddPassengerComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
public secondaryColour = "#ffffff";
  position = 'bottom-right';
  addPassengerForm: FormGroup;
  isSubmitted: boolean = false;
  extension: any;
  isImageExtensionError: Boolean = false;
  isImageSelected: Boolean = false;
  profilePhoto: any = {};
  countries: any;
  countryFlagUrl: any;

  constructor(
    config: NgbDatepickerConfig,
    private validation: Validation,
    private passengerService: PassengerService,
    private toastyService: ToastyService,
    private router: Router,
    private fileValidator: FileValidator
  ) { 
    config.minDate = { year: 1900, month: 1, day: 1 };
    config.maxDate = { year: (new Date()).getFullYear(), month: (new Date()).getMonth(), day: (new Date()).getDate() };
  }

  ngOnInit() {
    this.addPassengerForm = new FormGroup({
      name: new FormControl("", [Validators.required, Validators.pattern(this.validation.alphabaticOnly), Validators.minLength(2), Validators.maxLength(50)]),
      email: new FormControl("", [Validators.pattern(this.validation.email)]),
      dob: new FormControl("", [Validators.required]),
      countryCode: new FormControl("", [Validators.required]),
      phoneNumber: new FormControl("", [Validators.required, Validators.minLength(8), Validators.maxLength(16), Validators.pattern(this.validation.integer)]),
      profilePhoto: new FormControl("", [])
    })
    this.getAllCountries()
  }

  getAllCountries() {
    this.loading = true;
    this.passengerService.getAllCountries().subscribe(
      respone => {
        this.loading = false;
        let resData = JSON.parse(JSON.stringify(respone));
        this.countries = resData.data.countries;
        this.countryFlagUrl = resData.data.countryFlagUrl;
        this.addPassengerForm.patchValue({
          countryCode: this.countries[0].phoneCode
        })
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

  onChangeMobileNumber() {
    let firstDigit = this.addPassengerForm.value.phoneNumber.slice(0,1);
    if(firstDigit == 0) {
      this.addPassengerForm.value.phoneNumber = this.addPassengerForm.value.phoneNumber.slice(1,this.addPassengerForm.value.phoneNumber.length);
      this.addPassengerForm.patchValue({
       'phoneNumber': this.addPassengerForm.value.phoneNumber
      })
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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.addPassengerForm.valid && !this.isImageExtensionError) {
      this.loading = true;

      if(this.addPassengerForm.value && !this.addPassengerForm.value.onlyPhoneNumber) {
        if(this.addPassengerForm.value.dob.month.toString().length <= 1) {
          this.addPassengerForm.value.dob.month = '0' + this.addPassengerForm.value.dob.month;
        }
        if(this.addPassengerForm.value.dob.day.toString().length <= 1) {
          this.addPassengerForm.value.dob.day = '0' + this.addPassengerForm.value.dob.day;
        }
        this.addPassengerForm.value.dob = this.addPassengerForm.value.dob.year + '-' + this.addPassengerForm.value.dob.month + '-' + this.addPassengerForm.value.dob.day;
        this.addPassengerForm.value.onlyPhoneNumber = this.addPassengerForm.value.phoneNumber;
        this.addPassengerForm.value.phoneNumber = this.addPassengerForm.value.countryCode +  this.addPassengerForm.value.phoneNumber;
      }
      
      let params = this.addPassengerForm.value;
      let formData: FormData = new FormData();
      for (let key in params) {
          formData.append(key, params[key]);
      }
      if(this.isImageSelected) {
        formData.append("profilePhoto", this.profilePhoto);
      }
      this.passengerService.addPassenger(formData)
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
