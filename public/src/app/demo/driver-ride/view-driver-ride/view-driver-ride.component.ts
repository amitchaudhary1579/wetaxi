import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { CreditService, AuthService } from '../../services';
import { DriverRideService } from '../../services/driver-ride.service';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router, ActivatedRoute } from '@angular/router';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { Validation } from '../../helper/validation';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import { Location } from '@angular/common';


class Credit {
  public amount?: string;
  public createdAt?: string;
}

class DataTablesResponse {
  data: any[];
  draw: number;
  recordsFiltered: number;
  recordsTotal: number;
}
@Component({
  selector: 'app-view-driver-ride',
  templateUrl: './view-driver-ride.component.html'
})
export class ViewDriverRideComponent implements AfterViewInit, OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  addCreditForm: FormGroup;
  isSubmitted: boolean = false;
  driverData: any = {};
  driver_id: any;
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject(); @ViewChild(DataTableDirective)
  credits: Credit[] = [];
  searchForm: FormGroup;
  balance: number = 0;
  driverName: string;
  @ViewChild('closeBtn') closeBtn;
  profileImageUrl: any;
  @ViewChild('myPersistenceModal') myPersistenceModal;


  constructor(
    private creditService: CreditService,
    private authService: AuthService,
    private driverRideService: DriverRideService,
    private toastyService: ToastyService,
    private router: Router,
    private validation: Validation,
    private location: Location,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.profileImageUrl = environment.profileImageUrl;
    this.route.params.subscribe(params => {
      this.driver_id = params.driver_id;
    });
    this.getDriverDetails();
    this.authService.clearDataTableData("DataTables_credit_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: false,
      order: [1, 'desc'],
      // searching: false,
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        localStorage.setItem(
          "DataTables_credit_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function (settings) {
        return JSON.parse(localStorage.getItem("DataTables_credit_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        dataTablesParameters.driverId = this.driver_id;

        this.driverRideService.ListOfAllDriversRide(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.credits = resp.data;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: []
            });
          },
          error => {
            this.loading = false;
            this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          }
        );
      },
      columns: [
        { data: "rideId", orderable: false },
        { data: "acceptedAt" },
        { data: "pickupAddress" },
        { data: "destinationAddress" },
        { data: "toatlFare" },
        { data: "toatlDistance" },
        { data: "totalTime" },
        { data: "reasonText" },
        { data: "isVerified", orderable: false, searchable: false },
        { data: "actions", orderable: false, searchable: false }
      ]
    };
  }

  imgErrorHandler(event) {
    event.target.src = this.profileImageUrl + 'default.png';
  }
  backHierarchy(){
    this.location.back();
  }

  blockUnblockDriver(rides: any) {
    let text;
    let reason_title;
    if (rides.cancelBy == 'passenger') {
      text = "Reason:" + rides.reasonText.en;
      reason_title = 'Ride Is Cancelled By Passanger';
    } else {
      text = "Reason:" + rides.reasonText.en;
      reason_title = 'Ride Is Cancelled By System';
    }
    Swal({
      title: reason_title,
      text: text,
      type: 'warning',
      showCloseButton: true
    })
  }

  cancelRideSystem(rides: any) {
    let text = 'You want to cancel ride ?';
    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
      if (willDelete && !willDelete.dismiss) {
        let data = {
          'ride_id': rides._id
        }
        this.driverRideService.CancelRide(data).subscribe(
          next => {
            if (next.status_code == 200) {
              this.rerender();
              Swal('Success', next.message, 'success');
            } else {
              Swal('Error', next.message, 'error');
            }
          },
          error => {
            Swal('Error', "Ride can not cancel successfully.", 'error');
          }
        );
      } else {
      }
    });
  }


  openModal() {
    this.isSubmitted = false;
    this.myPersistenceModal.show();
  }

  getDriverDetails() {
    this.loading = true;
    let driverData = {
      'driver_id': this.driver_id
    }
    this.creditService.getDriverDetails(driverData).subscribe(
      respone => {
        this.loading = false;
        this.driverData = respone.data;
        this.driverName = this.driverData.name;
      },
      error => {
        this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }


  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
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
