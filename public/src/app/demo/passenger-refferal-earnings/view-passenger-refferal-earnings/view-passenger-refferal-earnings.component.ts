import { Component, OnInit, ViewChild } from '@angular/core';
import { PassengerService ,AuthService} from '../../services';
import { ActivatedRoute } from '@angular/router';
import { ToastyService, ToastOptions, ToastData } from 'ng2-toasty';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DriverRideService } from '../../services/driver-ride.service';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { RewardService } from '../../services/reward.service';
import { RefferalEarningService } from '../../services/refferal-earning.service';
import { Location } from '@angular/common';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

@Component({
  selector: 'app-view-passenger-refferal-earnings',
  templateUrl: './view-passenger-refferal-earnings.component.html'
})
export class ViewPassengerRefferalEarningsComponent implements OnInit {
  public passenger_id: any;
  public passenger_ride_earning: any;
  public passenger_ride_earning_balance: any;
  public viewPassengerData: any;
  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();@ViewChild(DataTableDirective)
  credits: any;
  balance: number = 0;
  driverName: string;
  @ViewChild('closeBtn') closeBtn;
  profileImageUrl: any;
  @ViewChild('myPersistenceModal') myPersistenceModal;
  submitted = false;
  filterForm = this.fb.group({
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required]
  });
  filterValue: any = {};

  constructor(
    private passengerService: PassengerService,
    private route: ActivatedRoute,
    private toastyService: ToastyService,
    private authService: AuthService,
    private rewardService: RewardService,
    private refferalEarningService: RefferalEarningService,
    private location: Location,
    private fb: FormBuilder,
    config: NgbDatepickerConfig,
  ) {
    config.minDate = { year: 1900, month: 1, day: 1 };
    config.maxDate = { year: (new Date()).getFullYear(), month: (new Date()).getMonth() + 1, day: (new Date()).getDate() };
  }

  ngOnInit() {
    this.profileImageUrl = environment.profileImageUrl;

    this.route.params.subscribe(params => {
      this.passenger_id = params.passenger_id;
    });
    this.getPassengerDetails();
    this.authService.clearDataTableData("DataTables_credit_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      processing: false,
      order: [ 1, 'desc' ],
      // searching: false,
      stateSave: true,
      stateSaveCallback: function(settings, data) {
        localStorage.setItem(
          "DataTables_credit_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function(settings) {
        return JSON.parse(localStorage.getItem("DataTables_credit_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        dataTablesParameters.passenger_id = this.passenger_id;
        dataTablesParameters.filter = this.filterValue;
        this.refferalEarningService.GetPassengerReferralEarning(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.passenger_ride_earning = resp.data;
            this.passenger_ride_earning_balance = resp;
            callback({
              recordsTotal: resp.recordsTotal,
              recordsFiltered: resp.recordsFiltered,
              data: []
            });
          },
          error => {
            this.loading = false;
            this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
          }
        );
      },
      columns: [
        { data: "autoIncrementID" },
        { data: "rideId", orderable: false },
        { data: "createdAt" },
        { data: "pickupAddress" },
        { data: "destinationAddress" },
        { data: "referralAmount" },
        { data: "isWithdrawed" },
      ]
    };
  }
  backHierarchy(){
    this.location.back();
  }

  blockUnblockDriver(passanger: any) {
    let text;
    let reason_title;
    if(passanger.cancelReason) {
      text = "Reason:" +passanger.cancelReason.name.en;
      reason_title = 'Ride Is Cancelled By Passanger';
    } else {
      text = '';
      reason_title = 'Ride Is Cancelled By System';
    }

    Swal({
      title: reason_title,
      text: text,
      type: 'warning',
      showCloseButton: true
    })
  }
  imgErrorHandler(event){
    event.target.src = this.profileImageUrl + 'default.png';
  } 

  cancelRideSystem(rides: any) {
    let text;
      text = 'You want to cancel ride ?';
    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
        if (willDelete && !willDelete.dismiss) {
                Swal('Success', "Driver unblocked successfully.", 'success');
         
        } else {
          
        }
      });
  }
  getPassengerDetails() {
    this.loading = true;
    let passengerData = {
      'passenger_id': this.passenger_id
    }
    this.passengerService.getPassengerDetails(passengerData).subscribe(
      respone => {
        this.loading = false;
        this.viewPassengerData = respone.data;
      },
      error => {
        this.loading = false;
        this.addToast({title:'Error', msg:error.message, timeout: 5000, theme:'default', position:'bottom-right', type:'error'});
      }
    );
  }

  withdraw_earning(operator: any) {
    let text;
    text = 'you want to Withdraw Referral Amount';
    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
      if (willDelete && !willDelete.dismiss) {
        let data = {
          'passengerRefLogsId': operator._id
        }
        this.refferalEarningService.PassengerRefEarningWithdraw(data).subscribe(
          next => {
            if (next.status_code == 200) {
              this.rerender();
              Swal('Success', next.message, 'success');
            } else {
              Swal('Error', next.message, 'error');
            }
          },
          error => {
            Swal('Error', "Referral Amount is not Withdraw Sucessfully.", 'error');
          }
        );
      } else { }
    });
  }

  all_withdraw_earning(operator: any) {
    let text;
    text = 'you want to Withdraw All Referral Amount';
    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
      if (willDelete && !willDelete.dismiss) {
        let data = {
          'passenger_id': this.passenger_id,
          'total_amount':operator
        }
        this.refferalEarningService.PassengerRefEarWithdrawAll(data).subscribe(
          next => {
            if (next.status_code == 200) {
              this.rerender();
              Swal('Success', next.message, 'success');
            } else {
              Swal('Error', next.message, 'error');
            }
          },
          error => {
            Swal('Error', "Referral Amount is not Withdraw Sucessfully.", 'error');
          }
        );
      } else { }
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
  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
    });
  }

  filterList() {
    this.submitted = true;

    if (this.filterForm.status == "INVALID")
      return;

    let { fromDate, toDate } = this.filterForm.value;

    this.filterValue = {
      fromDate: moment().utc().year(fromDate.year).month(fromDate.month - 1).date(fromDate.day).hours(0).minutes(0).seconds(0).milliseconds(0).toISOString(),
      toDate: moment().utc().year(toDate.year).month(toDate.month - 1).date(toDate.day).hours(23).minutes(59).seconds(59).milliseconds(999).toISOString()
    };

    this.rerender();
  }

  resetFilter() {
    this.submitted = false;
    this.filterValue = {}
    this.filterForm.reset();
    this.rerender();
  }
}
