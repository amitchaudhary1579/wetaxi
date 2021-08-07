import { Component, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Validation } from "../../helper/validation";
import { ToastyService, ToastOptions, ToastData } from "ng2-toasty";
import { Router, ActivatedRoute } from '@angular/router';
import { FileValidator } from "../../helper/file-input.validator";
import { VehicleService } from "../../services";
import { environment } from 'src/environments/environment';
@Component({
  selector: "view-vehicle",
  templateUrl: "./view-vehicle.component.html"
})
export class ViewVehicleComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  action: string = 'view';
  position = "bottom-right";
  viewVehicleForm: FormGroup;
  isSubmitted: boolean = false;
  isImageExtensionError: Boolean = false;
  isImageSelected: Boolean = false;
  image: any = {};
  vehicle_id: any;
  vehicleData: any;
  vehicleTypeImageUrl: any;

  constructor(
    private validation: Validation,
    private vehicleService: VehicleService,
    private toastyService: ToastyService,
    private router: Router,
    private route: ActivatedRoute,
    private fileValidator: FileValidator
  ) {}

  ngOnInit() {
    this.vehicleTypeImageUrl = environment.vehicleTypeImageUrl;
    this.route.params.subscribe(params => {
      this.vehicle_id = params.vehicle_id;
    });
    this.viewVehicleForm = new FormGroup({
      name_en: new FormControl("", [
        Validators.required,
        Validators.pattern(this.validation.alphabaticOnly),
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      name_ch: new FormControl("", [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]),
      name_kh: new FormControl("", [
        Validators.required,
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
    this.getVehicleDetails();
  }

  onEdit() {
    this.action = 'edit';
  }

  getVehicleDetails() {
    this.loading = true;
    let vehicleData = {
      'vehicle_id': this.vehicle_id
    }
    this.vehicleService.getVehicleDetails(vehicleData).subscribe(
      respone => {
        this.loading = false;
        this.vehicleData = respone.data;
        this.viewVehicleForm.setValue({
          name_en: this.vehicleData.type.en,
          name_ch: this.vehicleData.type.zh,
          name_kh: this.vehicleData.type.km,
          minFare: this.vehicleData.minFare,
          feePerKM: this.vehicleData.feePerKM,
          image: ''
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

  onDelete() {
    this.loading = true;
    let vehicleData = {
      'vehicle_id': this.vehicle_id
    }
    this.vehicleService.deleteVehicleType(vehicleData).subscribe(
      next => {
        this.loading = false;
        if(next.status_code == 200) {
          this.addToast({title:'Success', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'success'});
         this.router.navigate(["/vehicle/list-vehicle"]);
        } else {
          this.addToast({title:'Error', msg:next.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});          
        }  
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
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
    if (this.viewVehicleForm.valid && !this.isImageExtensionError) {
      this.loading = true;

      let formData: FormData = new FormData();
      let type:any = {};
      type.en = this.viewVehicleForm.value.name_en;
      type.zh = this.viewVehicleForm.value.name_ch;
      type.km = this.viewVehicleForm.value.name_kh;

      formData.append('type', JSON.stringify(type));

      delete this.viewVehicleForm.value.name_en;
      delete this.viewVehicleForm.value.name_ch;
      delete this.viewVehicleForm.value.name_kh;
      delete this.viewVehicleForm.value.image;

      this.viewVehicleForm.value.vehicle_id = this.vehicle_id;
      let params = this.viewVehicleForm.value;
      for (let key in params) {
          formData.append(key, params[key]);
      }

      if(this.isImageSelected) {
        formData.append("image", this.image);
      }
      
      this.vehicleService.editVehicleType(formData)
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
