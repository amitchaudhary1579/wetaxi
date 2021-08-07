import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Validation } from "../../helper/validation";
import { ToastyService, ToastOptions, ToastData } from "ng2-toasty";
import { Router } from "@angular/router";
import { FileValidator } from "../../helper/file-input.validator";
import { VehicleService } from "../../services";
@Component({
  selector: "add-vehicle",
  templateUrl: "./add-vehicle.component.html"
})
export class AddVehicleComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = "bottom-right";
  addVehicleForm: FormGroup;
  isSubmitted: boolean = false;
  isImageExtensionError: Boolean = false;
  isImageSelected: Boolean = false;
  image: any = {};

  constructor(
    private validation: Validation,
    private vehicleService: VehicleService,
    private toastyService: ToastyService,
    private router: Router,
    private fileValidator: FileValidator
  ) {}

  ngOnInit() {
    this.addVehicleForm = new FormGroup({
      name_en: new FormControl("", [
        Validators.required,
        Validators.pattern(this.validation.alphabaticOnly),
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      name_ch: new FormControl("", [
        Validators.required,
        // Validators.pattern(this.validation.alphabaticOnly),
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      name_kh: new FormControl("", [
        Validators.required,
        // Validators.pattern(this.validation.alphabaticOnly),
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      minFare: new FormControl("", [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(5),
        Validators.pattern(this.validation.integer)
      ]),
      feePerKM: new FormControl("", [
        Validators.required,
        Validators.minLength(1),
        Validators.maxLength(5),
        Validators.pattern(this.validation.integer)
      ]),
      image: new FormControl("", [])
    });
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
      this.isImageSelected = true;
      let file = e.target.files[0];
      if (file) {
        if (!this.fileValidator.validateImage(file.name)) {
          this.isImageExtensionError = true;
        } else {
          this.isImageExtensionError = false;
          let reader = new FileReader();
          reader.onload = (e: any) => {
            var image = new Image();
            image.src = e.target.result;
          };
          this.image = file;
        }
      }
    } else {
      this.image = "";
      this.isImageSelected = false;
      this.isImageExtensionError = false;
    }
  }


  onFormSubmit() {
    this.isSubmitted = true;
    if (this.addVehicleForm.valid && this.isImageSelected && !this.isImageExtensionError) {
      this.loading = true;

      let formData: FormData = new FormData();
      let type:any = {};
      type.en = this.addVehicleForm.value.name_en;
      type.zh = this.addVehicleForm.value.name_ch;
      type.km = this.addVehicleForm.value.name_kh;

      formData.append('type', JSON.stringify(type));

      delete this.addVehicleForm.value.name_en;
      delete this.addVehicleForm.value.name_ch;
      delete this.addVehicleForm.value.name_kh;
      delete this.addVehicleForm.value.image;

      let params = this.addVehicleForm.value;
      for (let key in params) {
          formData.append(key, params[key]);
      }

      if(this.isImageSelected) {
        formData.append("image", this.image);
      }
      
      this.vehicleService.addVehicleType(formData)
        .subscribe(next => {
            this.loading = false;
            this.isSubmitted = false;
            if (next.status_code == 200) {
              this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
              this.router.navigate(["/vehicle/list-vehicle"]);
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
