import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Validation } from "../../helper/validation";
import { ToastyService, ToastOptions, ToastData } from "ng2-toasty";
import { Router } from "@angular/router";
import { FileValidator } from "../../helper/file-input.validator";
import { DriverService } from "../../services";
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';
@Component({
  selector: "add-driver",
  templateUrl: "./add-driver.component.html"
})
export class AddDriverComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = "bottom-right";
  addDriverForm: FormGroup;
  isSubmitted: boolean = false;
  isProfileExtensionError: Boolean = false;
  isProfileSelected: Boolean = false;
  profilePhoto: any = {};
  countries: any;
  vehicleTypes: any;
  vehicleColors: any;
  countryFlagUrl: any;
  vehicleTypeImageUrl: any = environment.vehicleTypeImageUrl;

  /** vehicle photos variables */
  vehiclePhotoImageArray: any = [];
  vehiclePhotoLengthError: Boolean = false;
  isVehiclePhotosExtensionError: Boolean = false;
  isVehiclePhotosSelected: Boolean = false;

  /** id photos variables */
  idPhotoImageArray: any = [];
  idPhotoImageLengthError: Boolean = false;
  isIdPhotosExtensionError: Boolean = false;
  isIdPhotosSelected: Boolean = false;

  /** vehicle id photos variables */
  vehicleIdPhotoImageArray: any = [];
  vehicleIdPhotoImageLengthError: Boolean = false;
  isVehicleIdPhotosExtensionError: Boolean = false;
  isVehicleIdPhotosSelected: Boolean = false;

  /** plate number photos variables */
  plateNoPhotoImageArray: any = [];
  plateNoPhotoImageLengthError: Boolean = false;
  isPlateNoPhotosExtensionError: Boolean = false;
  isPlateNoPhotosSelected: Boolean = false;

  constructor(
    config: NgbDatepickerConfig,
    private validation: Validation,
    private driverService: DriverService,
    private toastyService: ToastyService,
    private router: Router,
    private fileValidator: FileValidator
  ) {
    config.minDate = {year: 1900, month: 1, day: 1};
    config.maxDate = {year: (new Date()).getFullYear(), month: (new Date()).getMonth(), day: (new Date()).getDate()};
   }

  ngOnInit() {
    this.addDriverForm = new FormGroup({
      name: new FormControl("", [
        Validators.required,
        Validators.pattern(this.validation.alphabaticOnly),
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      email: new FormControl("", [
        Validators.pattern(this.validation.email)
      ]),
      dob: new FormControl("", [Validators.required]),
      countryCode: new FormControl("", [Validators.required]),
      phoneNumber: new FormControl("", [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(16),
        Validators.pattern(this.validation.integer)
      ]),
      profilePhoto: new FormControl("", []),
      typeId: new FormControl("", [Validators.required]),
      year: new FormControl("", [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(5),
        Validators.pattern(this.validation.integer)
      ]),
      seats: new FormControl("", [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(2),
        Validators.pattern(this.validation.integer)
      ]),
      color: new FormControl("", [Validators.required]),
      model: new FormControl("", [
        Validators.required,
        // Validators.pattern(this.validation.model),
        Validators.minLength(2),
        Validators.maxLength(32)
      ]),
      platNumber: new FormControl("", [
        Validators.required,
        // Validators.pattern(this.validation.model),
        Validators.minLength(2),
        Validators.maxLength(32)
      ]),
      isAcAvailable: new FormControl(true, []),
      isSmokingAllowed: new FormControl(false, []),
      vehiclePhotos: new FormControl('', []),
      idPhotos: new FormControl('', []),
      vehicleIdPhotos: new FormControl('', []),
      // plateNoPhotos: new FormControl('', [])
    });
    this.getAllCountries();
    this.getAllVehicleTypes();
  }

  getAllCountries() {
    this.loading = true;
    this.driverService.getAllCountries().subscribe(
      respone => {
        this.loading = false;
        let resData = JSON.parse(JSON.stringify(respone));
        this.countries = resData.data.countries;
        this.countryFlagUrl = resData.data.countryFlagUrl;
        this.addDriverForm.patchValue({
          countryCode: this.countries[0].phoneCode
        });
      },
      error => {
        this.loading = false;
        this.addToast({
          title: "Error",
          msg: error.message,
          timeout: 5000,
          theme: "default",
          position: "bottom-right",
          type: "error"
        });
      }
    );
  }

  getAllVehicleTypes() {
    this.loading = true;
    this.driverService.getAllVehicleTypes().subscribe(
      respone => {
        this.loading = false;
        let resData = JSON.parse(JSON.stringify(respone));
        let vehicleTypesArray = resData.data.vehicleType;
        let vehicleColorsArray = resData.data.colors;
        this.vehicleTypes = vehicleTypesArray.map(function(vehicleType) {
          return { label: vehicleType.type.en, value: vehicleType._id, image: vehicleType.image }
        });

        this.vehicleColors = vehicleColorsArray.map(function(vehicleColor) {
          return { label: vehicleColor.name.en, value: vehicleColor.code }
        });
      },
      error => {
        this.loading = false;
        this.addToast({
          title: "Error",
          msg: error.message,
          timeout: 5000,
          theme: "default",
          position: "bottom-right",
          type: "error"
        });
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
      onAdd: (toast: ToastData) => {},
      onRemove: (toast: ToastData) => {}
    };

    switch (options.type) {
      case "default":
        this.toastyService.default(toastOptions);
        break;
      case "info":
        this.toastyService.info(toastOptions);
        break;
      case "success":
        this.toastyService.success(toastOptions);
        break;
      case "wait":
        this.toastyService.wait(toastOptions);
        break;
      case "error":
        this.toastyService.error(toastOptions);
        break;
      case "warning":
        this.toastyService.warning(toastOptions);
        break;
    }
  }

  onImageChange(e) {
    const vm = this;
    if (e.target.files.length > 0) {
      this.isProfileSelected = true;
      let file = e.target.files[0];
      if (file) {
        if (!this.fileValidator.validateImage(file.name)) {
          this.isProfileExtensionError = true;
        } else {
          this.isProfileExtensionError = false;
          let reader = new FileReader();
          reader.onload = (e: any) => {
            var image = new Image();
            image.src = e.target.result;
          };
          this.profilePhoto = file;
        }
      }
    } else {
      this.profilePhoto = "";
      this.isProfileSelected = false;
      this.isProfileExtensionError = false;
    }
  }

  onVehicleImageChange(e) {
    this.vehiclePhotoImageArray = [];
    const vm = this;
    if (e.target.files.length > 0) {
      this.isVehiclePhotosSelected = true;
      let filesLength = e.target.files.length;
      let files = e.target.files;
      for (let i = 0; i < filesLength; i++) {
        if (!this.fileValidator.validateImage(files[i].name)) {
          this.isVehiclePhotosExtensionError = true;
        } else {
          this.isVehiclePhotosExtensionError = false;
          let reader = new FileReader();
          reader.onload = (e: any) => {
            var image = new Image();
            image.src = e.target.result;
          };
          this.vehiclePhotoImageArray.push(files[i]);
        }
      }
      if(this.vehiclePhotoImageArray.length < 1 || this.vehiclePhotoImageArray.length > 3) {
        this.vehiclePhotoLengthError = true;
      } else {
        this.vehiclePhotoLengthError = false;
      }
    } else {
      this.vehiclePhotoImageArray = [];
      this.vehiclePhotoLengthError = true;
      this.isVehiclePhotosSelected = false;
      this.isVehiclePhotosExtensionError = false;
    }
  }

  onIdImageChange(e) {
    this.idPhotoImageArray = [];
    const vm = this;
    if (e.target.files.length > 0) {
      this.isIdPhotosSelected = true;
      let filesLength = e.target.files.length;
      let files = e.target.files;
      for (let i = 0; i < filesLength; i++) {
        if (!this.fileValidator.validateImage(files[i].name)) {
          this.isIdPhotosExtensionError = true;
        } else {
          this.isIdPhotosExtensionError = false;
          let reader = new FileReader();
          reader.onload = (e: any) => {
            var image = new Image();
            image.src = e.target.result;
          };
          this.idPhotoImageArray.push(files[i]);
        }
      }
      if(this.idPhotoImageArray.length < 1 || this.idPhotoImageArray.length > 2) {
        this.idPhotoImageLengthError = true;
      } else {
        this.idPhotoImageLengthError = false;
      }
    } else {
      this.idPhotoImageArray = [];
      this.idPhotoImageLengthError = true;
      this.isIdPhotosSelected = false;
      this.isIdPhotosExtensionError = false;
    }
  }

  onVehicleIdImageChange(e) {
    this.vehicleIdPhotoImageArray = [];
    const vm = this;
    if (e.target.files.length > 0) {
      this.isVehicleIdPhotosSelected = true;
      let filesLength = e.target.files.length;
      let files = e.target.files;
      for (let i = 0; i < filesLength; i++) {
        if (!this.fileValidator.validateImage(files[i].name)) {
          this.isVehicleIdPhotosExtensionError = true;
        } else {
          this.isVehicleIdPhotosExtensionError = false;
          let reader = new FileReader();
          reader.onload = (e: any) => {
            var image = new Image();
            image.src = e.target.result;
          };
          this.vehicleIdPhotoImageArray.push(files[i]);
        }
        if(this.vehicleIdPhotoImageArray.length < 1 || this.vehicleIdPhotoImageArray.length > 2) {
          this.vehicleIdPhotoImageLengthError = true;
        } else {
          this.vehicleIdPhotoImageLengthError = false;
        }
      }
    } else {
      this.vehicleIdPhotoImageArray = [];
      this.vehicleIdPhotoImageLengthError = true;
      this.isVehicleIdPhotosSelected = false;
      this.isVehicleIdPhotosExtensionError = false;
    }
  }

  // onPlateNumberImageChange(e) {
  //   this.plateNoPhotoImageArray = [];
  //   const vm = this;
  //   if (e.target.files.length > 0) {
  //     this.isPlateNoPhotosSelected = true;
  //     let filesLength = e.target.files.length;
  //     let files = e.target.files;
  //     for (let i = 0; i < filesLength; i++) {
  //       if (!this.fileValidator.validateImage(files[i].name)) {
  //         this.isPlateNoPhotosExtensionError = true;
  //       } else {
  //         this.isPlateNoPhotosExtensionError = false;
  //         let reader = new FileReader();
  //         reader.onload = (e: any) => {
  //           var image = new Image();
  //           image.src = e.target.result;
  //         };
  //         this.plateNoPhotoImageArray.push(files[i]);
  //       }
  //       if(this.plateNoPhotoImageArray.length < 1 || this.plateNoPhotoImageArray.length > 1) {
  //         this.plateNoPhotoImageLengthError = true;
  //       } else {
  //         this.plateNoPhotoImageLengthError = false;
  //       }
  //     }
  //   } else {
  //     this.plateNoPhotoImageArray = [];
  //     this.plateNoPhotoImageLengthError = true;
  //     this.isPlateNoPhotosSelected = false;
  //     this.isPlateNoPhotosExtensionError = false;
  //   }
  // }

  onChangeMobileNumber() {
    let firstDigit = this.addDriverForm.value.phoneNumber.slice(0,1);
    if(firstDigit == 0) {
      this.addDriverForm.value.phoneNumber = this.addDriverForm.value.phoneNumber.slice(1,this.addDriverForm.value.phoneNumber.length);
      this.addDriverForm.patchValue({
       'phoneNumber': this.addDriverForm.value.phoneNumber
      })
    }
  }

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.addDriverForm.valid && 
      this.isProfileSelected && !this.isProfileExtensionError && 
      this.isVehiclePhotosSelected && !this.isVehiclePhotosExtensionError && !this.vehiclePhotoLengthError && 
      this.isIdPhotosSelected && !this.isIdPhotosExtensionError && !this.idPhotoImageLengthError && 
      this.isVehicleIdPhotosSelected && !this.isVehicleIdPhotosExtensionError && !this.vehicleIdPhotoImageLengthError 
      // this.isPlateNoPhotosSelected && !this.isPlateNoPhotosExtensionError && !this.plateNoPhotoImageLengthError
    ) {
      this.loading = true;

      if(this.addDriverForm.value && !this.addDriverForm.value.onlyPhoneNumber) {
        if(this.addDriverForm.value.dob.month.toString().length <= 1) {
          this.addDriverForm.value.dob.month = '0' + this.addDriverForm.value.dob.month;
        }
        if(this.addDriverForm.value.dob.day.toString().length <= 1) {
          this.addDriverForm.value.dob.day = '0' + this.addDriverForm.value.dob.day;
        }
        this.addDriverForm.value.dob = this.addDriverForm.value.dob.year + '-' + this.addDriverForm.value.dob.month + '-' + this.addDriverForm.value.dob.day;
        this.addDriverForm.value.onlyPhoneNumber = this.addDriverForm.value.phoneNumber;
        this.addDriverForm.value.phoneNumber = this.addDriverForm.value.countryCode +  this.addDriverForm.value.phoneNumber;
      }

      let params = this.addDriverForm.value;
      let formData: FormData = new FormData();
      for (let key in params) {
          formData.append(key, params[key]);
      }

      if(this.isProfileSelected) {
        formData.append("profilePhoto", this.profilePhoto);
      }
      if(this.isIdPhotosSelected) {
        for (let i = 0; i < this.idPhotoImageArray.length; i++) {
          formData.append('idPhotos', this.idPhotoImageArray[i], this.idPhotoImageArray[i].name);
        }
      }
      if(this.isVehiclePhotosSelected) {
        for (let i = 0; i < this.vehiclePhotoImageArray.length; i++) {
          formData.append('vehiclePhotos', this.vehiclePhotoImageArray[i], this.vehiclePhotoImageArray[i].name);
        }
      }
      if(this.isVehicleIdPhotosSelected) {
        for (let i = 0; i < this.vehicleIdPhotoImageArray.length; i++) {
          formData.append('vehicleIdPhotos', this.vehicleIdPhotoImageArray[i], this.vehicleIdPhotoImageArray[i].name);
        }
      }
      // if(this.isPlateNoPhotosSelected) {
      //   for (let i = 0; i < this.plateNoPhotoImageArray.length; i++) {
      //     formData.append('plateNoPhotos', this.plateNoPhotoImageArray[i], this.plateNoPhotoImageArray[i].name);
      //   }
      // }
      this.driverService.addDriver(formData)
        .subscribe(next => {
            this.loading = false;
            this.isSubmitted = false;
            if (next.status_code == 200) {
              this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
              this.router.navigate(["/driver/list-driver"]);
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
