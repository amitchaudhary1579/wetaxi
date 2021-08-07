import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Validation } from "../../helper/validation";
import { ToastyService, ToastOptions, ToastData } from "ng2-toasty";
import { Router, ActivatedRoute } from "@angular/router";
import { FileValidator } from "../../helper/file-input.validator";
import { DriverService } from "../../services";
import { NgbDateParserFormatter, NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'view-driver',
  templateUrl: './view-driver.component.html',
})
export class ViewDriverComponent implements OnInit {
  
  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = "bottom-right";
  action: string = 'view';
  billingPlanAction: string = 'view';
  viewDriverForm: FormGroup;
  viewDriverBillingPlanForm: FormGroup;
  isSubmitted: boolean = false;
  isBillingSubmitted: boolean = false;
  isProfileExtensionError: Boolean = false;
  isProfileSelected: Boolean = false;
  profilePhoto: any = {};
  countries: any;
  vehicleTypes: any;
  vehicleColors: any;
  billingPlans: any;
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

  driverData: any = {};
  driver_id: any;
  oldVehiclePhotos: any;
  oldIdPhotos: any;
  oldVehicleIdPhotos: any;
  oldPlateNoPhotos: any;
  profileImageUrl: any;
  vehicleImageUrl: any;
  disabled: Boolean = true;

  /** Manage remove photos array */
  removeVehiclePhotos: any = [];
  removeIdPhotos: any = [];
  removeVehicleIdPhotos: any = [];
  removePlateNumberPhotos: any = [];

  constructor(
    config: NgbDatepickerConfig,
    private validation: Validation,
    private driverService: DriverService,
    private toastyService: ToastyService,
    private router: Router,
    private route: ActivatedRoute,
    private fileValidator: FileValidator,
    private ngbDateParserFormatter: NgbDateParserFormatter
  ) {
    config.minDate = { year: 1900, month: 1, day: 1 };
    config.maxDate = {year: (new Date()).getFullYear(), month: (new Date()).getMonth(), day: (new Date()).getDate()};;
  }

  ngOnInit() {
    this.profileImageUrl = environment.profileImageUrl;
    this.vehicleImageUrl = environment.vehicleImageUrl;
    this.viewDriverForm = new FormGroup({
      name: new FormControl("", [
        Validators.required,
        Validators.pattern(this.validation.alpha_numeric_space),
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

    this.viewDriverBillingPlanForm = new FormGroup({
      billingId: new FormControl("", [Validators.required])
    })
    this.route.params.subscribe(params => {
      this.driver_id = params.driver_id;
    });
    this.getAllCountries();
    this.getAllVehicleTypes();
    this.getAllBillingPlans();
    this.getDriverDetails();
  }

  onEdit() {
    this.action = 'edit';
    this.disabled = false;
  }

  onEditBillingPlan() {
    this.billingPlanAction = 'edit';
  }

  getDriverDetails() {
    this.loading = true;
    let driverData = {
      'driver_id': this.driver_id
    }
    this.driverService.getDriverDetails(driverData).subscribe(
      respone => {
        this.loading = false;
        this.driverData = respone.data;
        this.oldVehiclePhotos = this.driverData.vehicle.vehiclePhotos;
        this.oldIdPhotos = this.driverData.idPhotos;
        this.oldVehicleIdPhotos = this.driverData.vehicle.vehicleIdPhotos;
        // this.oldPlateNoPhotos = this.driverData.vehicle.plateNoPhotos;
        this.viewDriverForm.patchValue({
          name: this.driverData.name,
          email: this.driverData.email,
          dob: this.ngbDateParserFormatter.parse(this.driverData.dob),
          countryCode: this.driverData.countryCode,
          phoneNumber: this.driverData.onlyPhoneNumber,
          typeId: [this.driverData.vehicle.typeId._id],
          year: this.driverData.vehicle.year,
          seats: this.driverData.vehicle.seats,
          color: [this.driverData.vehicle.color],
          model: this.driverData.vehicle.model,
          platNumber: this.driverData.vehicle.platNumber,
          isAcAvailable: this.driverData.vehicle.isAcAvailable,
          isSmokingAllowed: this.driverData.vehicle.isSmokingAllowed
        });
        this.viewDriverBillingPlanForm.setValue({
          billingId: this.driverData && this.driverData.billingId ? this.driverData.billingId : ''
        });
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
  }

  getAllCountries() {
    this.loading = true;
    this.driverService.getAllCountries().subscribe(
      respone => {
        this.loading = false;
        let resData = JSON.parse(JSON.stringify(respone));
        this.countries = resData.data.countries;
        this.countryFlagUrl = resData.data.countryFlagUrl;
        this.viewDriverForm.patchValue({
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

  getAllBillingPlans() {
    this.loading = true;
    this.driverService.getAllBillingPlans().subscribe(
      respone => {
        this.loading = false;
        let resData = JSON.parse(JSON.stringify(respone));
        let billingPlansArray = resData.data;
        this.billingPlans = billingPlansArray.map(function(billingPlan) {
          return { label: billingPlan.name.en, value: billingPlan._id }
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

  onChangeMobileNumber() {
    let firstDigit = this.viewDriverForm.value.phoneNumber.slice(0,1);
    if(firstDigit == 0) {
      this.viewDriverForm.value.phoneNumber = this.viewDriverForm.value.phoneNumber.slice(1,this.viewDriverForm.value.phoneNumber.length);
      this.viewDriverForm.patchValue({
       'phoneNumber': this.viewDriverForm.value.phoneNumber
      })
    }
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
      let filesLength = e.target.files.length;
      let files = e.target.files;
      for (let i = 0; i < filesLength; i++) {
        if (!this.fileValidator.validateImage(files[i].name)) {
          this.isVehiclePhotosExtensionError = true;
        } else {
          this.isVehiclePhotosSelected = true;
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

    /** check vehicle image length validation */
    if((this.vehiclePhotoImageArray.length + this.oldVehiclePhotos.length) < 1) {
      this.isVehiclePhotosSelected = false;
    } else if((this.vehiclePhotoImageArray.length + this.oldVehiclePhotos.length) > 3) {
      this.isVehiclePhotosSelected = true;
      this.vehiclePhotoLengthError = true;
    } else {
      this.isVehiclePhotosSelected = true;
      this.vehiclePhotoLengthError = false;
    }
  }

  onIdImageChange(e) {
    this.idPhotoImageArray = [];
    const vm = this;
    if (e.target.files.length > 0) {
      let filesLength = e.target.files.length;
      let files = e.target.files;
      for (let i = 0; i < filesLength; i++) {
        if (!this.fileValidator.validateImage(files[i].name)) {
          this.isIdPhotosExtensionError = true;
        } else {
          this.isIdPhotosSelected = true;
          this.isIdPhotosExtensionError = false;
          let reader = new FileReader();
          reader.onload = (e: any) => {
            var image = new Image();
            image.src = e.target.result;
          };
          this.idPhotoImageArray.push(files[i]);
        }
      }
    } else {
      this.idPhotoImageArray = [];
      this.isIdPhotosSelected = false;
      this.isIdPhotosExtensionError = false;
    }

    /** check id image length validation */
    if((this.idPhotoImageArray.length + this.oldIdPhotos.length) < 1) {
      this.isIdPhotosSelected = false;
    } else if((this.idPhotoImageArray.length + this.oldIdPhotos.length) > 2) {
      this.isIdPhotosSelected = true;
      this.idPhotoImageLengthError = true;
    } else {
      this.isIdPhotosSelected = true;
      this.idPhotoImageLengthError = false;
    }
  }

  onVehicleIdImageChange(e) {
    this.vehicleIdPhotoImageArray = [];
    const vm = this;
    if (e.target.files.length > 0) {
      let filesLength = e.target.files.length;
      let files = e.target.files;
      for (let i = 0; i < filesLength; i++) {
        if (!this.fileValidator.validateImage(files[i].name)) {
          this.isVehicleIdPhotosExtensionError = true;
        } else {
          this.isVehicleIdPhotosSelected = true;
          this.isVehicleIdPhotosExtensionError = false;
          let reader = new FileReader();
          reader.onload = (e: any) => {
            var image = new Image();
            image.src = e.target.result;
          };
          this.vehicleIdPhotoImageArray.push(files[i]);
        }
      }
    } else {
      this.vehicleIdPhotoImageArray = [];
      this.isVehicleIdPhotosSelected = false;
      this.isVehicleIdPhotosExtensionError = false;
    }

    /** check vehicle id image length validation */
    if((this.vehicleIdPhotoImageArray.length + this.oldVehicleIdPhotos.length) < 1) {
      this.isVehicleIdPhotosSelected = false;
    } else if((this.vehicleIdPhotoImageArray.length + this.oldVehicleIdPhotos.length) > 2) {
      this.isVehicleIdPhotosSelected = true;
      this.vehicleIdPhotoImageLengthError = true;
    } else {
      this.isVehicleIdPhotosSelected = true;
      this.vehicleIdPhotoImageLengthError = false;
    }
  }

  // onPlateNumberImageChange(e) {
  //   this.plateNoPhotoImageArray = [];
  //   const vm = this;
  //   if (e.target.files.length > 0) {
  //     let filesLength = e.target.files.length;
  //     let files = e.target.files;
  //     for (let i = 0; i < filesLength; i++) {
  //       if (!this.fileValidator.validateImage(files[i].name)) {
  //         this.isPlateNoPhotosExtensionError = true;
  //       } else {
  //         this.isPlateNoPhotosSelected = true;
  //         this.isPlateNoPhotosExtensionError = false;
  //         let reader = new FileReader();
  //         reader.onload = (e: any) => {
  //           var image = new Image();
  //           image.src = e.target.result;
  //         };
  //         this.plateNoPhotoImageArray.push(files[i]);
  //       }
  //     }
  //   } else {
  //     this.plateNoPhotoImageArray = [];
  //     this.isPlateNoPhotosSelected = false;
  //     this.isPlateNoPhotosExtensionError = false;
  //   }

  //    /** check plate number length validation */
  //    if((this.plateNoPhotoImageArray.length + this.oldPlateNoPhotos.length) < 1) {
  //     this.isPlateNoPhotosSelected = false;
  //   } else if((this.plateNoPhotoImageArray.length + this.oldPlateNoPhotos.length) > 1) {
  //     this.isPlateNoPhotosSelected = true;
  //     this.plateNoPhotoImageLengthError = true;
  //   } else {
  //     this.isPlateNoPhotosSelected = true;
  //     this.plateNoPhotoImageLengthError = false;
  //   }
  // }

  removeVehicleImage(imageName: any) {
      this.oldVehiclePhotos = this.oldVehiclePhotos.filter(item => item !== imageName)
      this.removeVehiclePhotos.push(imageName);

      /** check vehicle image length validation */
      if((this.vehiclePhotoImageArray.length + this.oldVehiclePhotos.length) < 1) {
        this.isVehiclePhotosSelected = false;
      } else if((this.vehiclePhotoImageArray.length + this.oldVehiclePhotos.length) > 3) {
        this.isVehiclePhotosSelected = true;
        this.vehiclePhotoLengthError = true;
      } else {
        this.isVehiclePhotosSelected = true;
        this.vehiclePhotoLengthError = false;
      }
  }

  removeIdImage(imageName: any) {
    this.oldIdPhotos = this.oldIdPhotos.filter(item => item !== imageName)
    this.removeIdPhotos.push(imageName);

    /** check id image length validation */
    if((this.idPhotoImageArray.length + this.oldIdPhotos.length) < 1) {
      this.isIdPhotosSelected = false;
    } else if((this.idPhotoImageArray.length + this.oldIdPhotos.length) > 2) {
      this.isIdPhotosSelected = true;
      this.idPhotoImageLengthError = true;
    } else {
      this.isIdPhotosSelected = true;
      this.idPhotoImageLengthError = false;
    }
  }

  removeVehicleIdImage(imageName: any) {
    this.oldVehicleIdPhotos = this.oldVehicleIdPhotos.filter(item => item !== imageName)
    this.removeVehicleIdPhotos.push(imageName);

    /** check vehicle id image length validation */
    if((this.vehicleIdPhotoImageArray.length + this.oldVehicleIdPhotos.length) < 1) {
      this.isVehicleIdPhotosSelected = false;
    } else if((this.vehicleIdPhotoImageArray.length + this.oldVehicleIdPhotos.length) > 2) {
      this.isVehicleIdPhotosSelected = true;
      this.vehicleIdPhotoImageLengthError = true;
    } else {
      this.isVehicleIdPhotosSelected = true;
      this.vehicleIdPhotoImageLengthError = false;
    }
  }

  // removePlateNumberImage(imageName: any) {
  //   this.oldPlateNoPhotos = this.oldPlateNoPhotos.filter(item => item !== imageName)
  //   this.removePlateNumberPhotos.push(imageName);

  //   /** check plate number length validation */
  //   if((this.plateNoPhotoImageArray.length + this.oldPlateNoPhotos.length) < 1) {
  //     this.isPlateNoPhotosSelected = false;
  //   } else if((this.plateNoPhotoImageArray.length + this.oldPlateNoPhotos.length) > 1) {
  //     this.isPlateNoPhotosSelected = true;
  //     this.plateNoPhotoImageLengthError = true;
  //   } else {
  //     this.isPlateNoPhotosSelected = true;
  //     this.plateNoPhotoImageLengthError = false;
  //   }
  // }

  onDelete() {
    this.loading = true;
    let driverData = {
      'driver_id': this.driver_id
    }
    this.driverService.deleteDriver(driverData).subscribe(
      next => {
        this.loading = false;
        if(next.status_code == 200) {
        } this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
        this.router.navigate(["/driver/list-driver"]);
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
  }

  onFormSubmit() {
    this.isSubmitted = true;
    
      /** check vehicle image length validation */
      if((this.vehiclePhotoImageArray.length + this.oldVehiclePhotos.length) < 1) {
        this.isVehiclePhotosSelected = false;
      } else if((this.vehiclePhotoImageArray.length + this.oldVehiclePhotos.length) > 3) {
        this.isVehiclePhotosSelected = true;
        this.vehiclePhotoLengthError = true;
      } else {
        this.isVehiclePhotosSelected = true;
        this.vehiclePhotoLengthError = false;
      }

      /** check id image length validation */
      if((this.idPhotoImageArray.length + this.oldIdPhotos.length) < 1) {
        this.isIdPhotosSelected = false;
      } else if((this.idPhotoImageArray.length + this.oldIdPhotos.length) > 2) {
        this.isIdPhotosSelected = true;
        this.idPhotoImageLengthError = true;
      } else {
        this.isIdPhotosSelected = true;
        this.idPhotoImageLengthError = false;
      }

      /** check vehicle id image length validation */
      if((this.vehicleIdPhotoImageArray.length + this.oldVehicleIdPhotos.length) < 1) {
        this.isVehicleIdPhotosSelected = false;
      } else if((this.vehicleIdPhotoImageArray.length + this.oldVehicleIdPhotos.length) > 2) {
        this.isVehicleIdPhotosSelected = true;
        this.vehicleIdPhotoImageLengthError = true;
      } else {
        this.isVehicleIdPhotosSelected = true;
        this.vehicleIdPhotoImageLengthError = false;
      }

      /** check plate number length validation */
      // if((this.plateNoPhotoImageArray.length + this.oldPlateNoPhotos.length) < 1) {
      //   this.isPlateNoPhotosSelected = false;
      // } else if((this.plateNoPhotoImageArray.length + this.oldPlateNoPhotos.length) > 1) {
      //   this.isPlateNoPhotosSelected = true;
      //   this.plateNoPhotoImageLengthError = true;
      // } else {
      //   this.isPlateNoPhotosSelected = true;
      //   this.plateNoPhotoImageLengthError = false;
      // }


    if (this.viewDriverForm.valid && 
      !this.isProfileExtensionError && 
      this.isVehiclePhotosSelected && !this.isVehiclePhotosExtensionError && !this.vehiclePhotoLengthError &&
      this.isIdPhotosSelected && !this.isIdPhotosExtensionError && !this.idPhotoImageLengthError && 
      this.isVehicleIdPhotosSelected && !this.isVehicleIdPhotosExtensionError && !this.vehicleIdPhotoImageLengthError  
      // this.isPlateNoPhotosSelected && !this.isPlateNoPhotosExtensionError && !this.plateNoPhotoImageLengthError
    ) {
      
      this.loading = true;

      if(this.viewDriverForm.value && !this.viewDriverForm.value.onlyPhoneNumber) {
        if(this.viewDriverForm.value.dob.month.toString().length <= 1) {
          this.viewDriverForm.value.dob.month = '0' + this.viewDriverForm.value.dob.month;
        }
        if(this.viewDriverForm.value.dob.day.toString().length <= 1) {
          this.viewDriverForm.value.dob.day = '0' + this.viewDriverForm.value.dob.day;
        }
        this.viewDriverForm.value.dob = this.viewDriverForm.value.dob.year + '-' + this.viewDriverForm.value.dob.month + '-' + this.viewDriverForm.value.dob.day;
        this.viewDriverForm.value.onlyPhoneNumber = this.viewDriverForm.value.phoneNumber;
        this.viewDriverForm.value.phoneNumber = this.viewDriverForm.value.countryCode +  this.viewDriverForm.value.phoneNumber;
      }
      this.viewDriverForm.value.driver_id = this.driver_id;

      let params = this.viewDriverForm.value;
      let formData: FormData = new FormData();
      for (let key in params) {
          formData.append(key, params[key]);
      }

      formData.append("removeIdPhotos", JSON.stringify(this.removeIdPhotos));
      formData.append("removeVehiclePhotos", JSON.stringify(this.removeVehiclePhotos));
      formData.append("removeVehicleIdPhotos", JSON.stringify(this.removeVehicleIdPhotos));
      // formData.append("removePlateNoPhotos", JSON.stringify(this.removePlateNumberPhotos));

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
      this.driverService.editDriver(formData)
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


  onBillingPlanFormSubmit() {
    this.isBillingSubmitted = true;
    if(this.viewDriverBillingPlanForm.valid) {
      this.viewDriverBillingPlanForm.value.driver_id = this.driver_id;
      this.driverService.updateBillingPlan(this.viewDriverBillingPlanForm.value)
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
