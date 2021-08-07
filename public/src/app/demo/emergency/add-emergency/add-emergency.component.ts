import {
  Component,
  OnInit,
  ElementRef,
  NgZone,
  ViewChild,
  ViewEncapsulation
} from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Validation } from "../../helper/validation";
import { EmergencyService } from "../../services";
import { ToastData, ToastOptions, ToastyService } from "ng2-toasty";
import { Router } from "@angular/router";
import { MapsAPILoader } from "@agm/core";
import { Marker } from "@agm/core/services/google-maps-types";
import { environment } from 'src/environments/environment';
@Component({
  selector: "add-emergency",
  templateUrl: "./add-emergency.component.html",
  encapsulation: ViewEncapsulation.None
})
export class AddEmergencyComponent implements OnInit {
  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  action: string = "view";
  position = "bottom-right";
  AddEmergencyForm: FormGroup;
  isSubmitted: boolean = false;

  /** location variables */
  locationEnabled: boolean = false;
  zoom: number = environment.default_map_zoom;
  public latitude: number;
  public longitude: number;
  googleAddress: string;
  private searchElementRef: ElementRef;
  @ViewChild("search") set content(content: ElementRef) {
    this.searchElementRef = content;
  }

  constructor(
    private validation: Validation,
    private emergencyService: EmergencyService,
    private toastyService: ToastyService,
    private router: Router,
    private mapsAPILoader: MapsAPILoader,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.AddEmergencyForm = new FormGroup({
      phoneNumber: new FormControl("", [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(16),
        Validators.pattern(this.validation.integer)
      ]),
      address: new FormControl("", [Validators.required])
    });
    this.initMapWithAutoCompleteGoogle();
  }

  /**
   * On load page intiat google address auto complete input feild
   */
  initMapWithAutoCompleteGoogle() {
    //set current position
    //this.loading = true;
    this.getLocationByLatLong(this.latitude, this.longitude);
    this.setCurrentPosition();
    this.mapsAPILoader.load().then(() => {
      let autocomplete = new google.maps.places.Autocomplete(
        this.searchElementRef.nativeElement,
        {
          types: []
        }
      );

      autocomplete.addListener("place_changed", () => {
        this.ngZone.run(() => {
          //get the place result
          let place: google.maps.places.PlaceResult = autocomplete.getPlace();
          //verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }

          //set latitude, longitude and zoom
          this.latitude = place.geometry.location.lat();
          this.longitude = place.geometry.location.lng();
          this.zoom = environment.default_map_zoom;
          this.googleAddress = this.searchElementRef.nativeElement.value
            ? this.searchElementRef.nativeElement.value
            : null;
          if (this.googleAddress && this.locationEnabled) {
            this.setAddressToSearchField(this.googleAddress);
          }
        });
      });
    });
  }

  /**
   * This function used for set address to reative form
   * @param address : address which we want to set
   */
  setAddressToSearchField(address: string) {
    this.AddEmergencyForm.patchValue({
      address: address
    });
  }

  /**
   * User allow location then set current location on map and address field
   * @param loadingHide : true or false for hide loader
   */
  setCurrentPosition(loadingHide: boolean = false) {
    let that = this;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        that.locationEnabled = true;
        that.latitude = position.coords.latitude;
        that.longitude = position.coords.longitude;
        that.zoom = environment.default_map_zoom;
        that.getLocationByLatLong(
          that.latitude,
          that.longitude,
          false,
          loadingHide
        );
      });
    }
  }

  /**
   * This funciton is used for get address using latitude and longitude
   * @param latitude
   * @param longitude
   * @param isChangeAddress
   * @param loadingHide
   */
  getLocationByLatLong(
    latitude,
    longitude,
    isChangeAddress: boolean = false,
    loadingHide: boolean = false
  ) {
    this.mapsAPILoader.load().then(() => {
      let geocoder = new google.maps.Geocoder();
      let latlng = { lat: Number(latitude), lng: Number(longitude) };
      let that = this;
      geocoder.geocode({ location: latlng }, results => {
        if (results && results[0]) {
          this.googleAddress = results[0].formatted_address;
          if (this.googleAddress && (this.locationEnabled || isChangeAddress)) {
            this.setAddressToSearchField(this.googleAddress);
          }
          if (loadingHide) this.loading = false;
        } else {
          if (loadingHide) this.loading = false;
          console.log("No results found");
        }
      });
    });
  }

  /**
   * When marker drag on map then change address using lat long
   * @param  $event : get event when
   */
  markerDragEnd($event: MouseEvent) {
    this.latitude = $event["coords"].lat;
    this.longitude = $event["coords"].lng;
    this.getLocationByLatLong(this.latitude, this.longitude, true);
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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.AddEmergencyForm.valid && this.latitude && this.longitude) {
      this.loading = true;
      this.AddEmergencyForm.value.latitude = this.latitude;
      this.AddEmergencyForm.value.longitude = this.longitude;
      this.emergencyService.AddEmergency(this.AddEmergencyForm.value).subscribe(
        next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.addToast({
              title: "Success",
              msg: next.message,
              timeout: 5000,
              theme: "default",
              position: "bottom-right",
              type: "success"
            });
            this.router.navigate(["/emergency/list-emergency"]);
          } else {
            this.addToast({
              title: "Error",
              msg: next.message,
              timeout: 5000,
              theme: "default",
              position: "bottom-right",
              type: "error"
            });
          }
        },
        error => {
          this.loading = false;
          this.isSubmitted = false;
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
  }
}
