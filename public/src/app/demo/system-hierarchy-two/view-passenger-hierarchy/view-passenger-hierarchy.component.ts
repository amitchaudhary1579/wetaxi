import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { CreditService, PassengerService } from '../../services';
import { ToastyService, ToastOptions, ToastData } from 'ng2-toasty';
import { RefferalHierarchyService } from '../../services/refferal-hierarchy.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-view-passenger-hierarchy',
  templateUrl: './view-passenger-hierarchy.component.html'
})
export class ViewPassengerHierarchyComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private creditService: CreditService,
    private toastyService: ToastyService,
    private passengerService: PassengerService,
    private refferalHierarchyService: RefferalHierarchyService,
    private location: Location,
  ) { }
  profileImageUrl: any;
  passenger_id: any;
  passengerDatalevel: any = [];
  public loading = false;
  passengerData: any = {};
  passengername: string;
  passenger_view_levels =[];
  position = 'bottom-right';
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  public viewPassengerData: any;

  ngOnInit() {
    this.profileImageUrl = environment.profileImageUrl;
    this.route.params.subscribe(params => {
      this.passenger_id = params.passenger_id;
    });
    this.getPassengerDetails();
  }
  getPassengerDetails() {
    this.loading = true;
    let passengerData = {
      'passenger_id': this.passenger_id
    }
    this.refferalHierarchyService.GetPassengerReferralDetails(passengerData).subscribe(
      respone => {
        this.loading = false;
        this.passengerData = respone.data;
        this.passengername = this.passengerData.passenger.name;
      },
      error => {
        this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }

  imgErrorHandler(event){
    event.target.src = this.profileImageUrl + 'default.png';
  } 

  backHierarchy(){
    this.location.back();
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
}
