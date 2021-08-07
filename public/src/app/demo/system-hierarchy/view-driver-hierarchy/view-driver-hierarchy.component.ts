import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ActivatedRoute } from '@angular/router';
import { CreditService } from '../../services';
import { ToastyService, ToastOptions, ToastData } from 'ng2-toasty';
import { RefferalHierarchyService } from '../../services/refferal-hierarchy.service';

@Component({
  selector: 'app-view-driver-hierarchy',
  templateUrl: './view-driver-hierarchy.component.html'
})
export class ViewDriverHierarchyComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private creditService: CreditService,
    private toastyService: ToastyService,
    private refferalHierarchyService: RefferalHierarchyService
  ) { }
  profileImageUrl: any;
  driver_id: any;
  driver_view_levels =[];
  public loading = false;
  driverData: any = {};
  driverName: string;
  position = 'bottom-right';
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";

  ngOnInit() {
    this.profileImageUrl = environment.profileImageUrl;
    this.route.params.subscribe(params => {
      this.driver_id = params.driver_id;
    });
    this.getDriverDetails();
  }
  getDriverDetails() {
    this.loading = true;
    let driverData = {
      'driver_id': this.driver_id
    }
    this.refferalHierarchyService.GetDriverReferralDetails(driverData).subscribe(
      respone => {
        this.loading = false;
        this.driverData = respone.data;
        this.driverName = this.driverData.driver.name;
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
