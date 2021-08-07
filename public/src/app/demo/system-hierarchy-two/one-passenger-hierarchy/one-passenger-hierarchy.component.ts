import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DriverService, AuthService } from '../../services';
import { RefferalHierarchyService } from '../../services/refferal-hierarchy.service';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-one-passenger-hierarchy',
  templateUrl: './one-passenger-hierarchy.component.html'
})
export class OnePassengerHierarchyComponent implements OnInit, AfterViewInit, OnDestroy {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  passengers;
  profilePhotoUrl: any;
  passenger_id: any;
  Level_id: any;
  submitted = false;
  filterForm = this.fb.group({
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required]
  });
  filterValue: any = {};

  constructor(
    private driverService: DriverService,
    private refferalHierarchyService: RefferalHierarchyService,
    private toastyService: ToastyService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    config: NgbDatepickerConfig,
  ) {
    config.minDate = { year: 1900, month: 1, day: 1 };
    config.maxDate = { year: (new Date()).getFullYear(), month: (new Date()).getMonth() + 1, day: (new Date()).getDate() };
  }


  ngOnInit() {
    this.route.params.subscribe(params => {
      this.passenger_id = params.passenger_id;
    });
    this.route.queryParams.subscribe(queryParams => {
      this.Level_id = queryParams.LevelId;
    });
    this.profilePhotoUrl = environment.profileImageUrl;
    this.authService.clearDataTableData("DataTables_driver_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      order: [0, 'desc'],
      serverSide: true,
      processing: false,
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        localStorage.setItem(
          "DataTables_driver_management",
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function (settings) {
        return JSON.parse(localStorage.getItem("DataTables_driver_management"));
      },
      ajax: (dataTablesParameters: any, callback) => {
        dataTablesParameters.search.value = dataTablesParameters.search.value.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
        dataTablesParameters.passenger_id = this.passenger_id;
        dataTablesParameters.filter = this.filterValue;
        // dataTablesParameters.passenger_level = Number(this.Level_id) + 1;
        dataTablesParameters.passenger_level = Number(1);

        this.refferalHierarchyService.ListPassengerReferralByLevel(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.passengers = resp.data;
            for (let index = 0; index < this.passengers.length; index++) {
              if (moment().format('D') == moment(this.passengers[index].passenger.dob).format('D') && moment().format('MMMM') == moment(this.passengers[index].passenger.dob).format('MMMM')) {
                this.passengers[index].passenger.isSelected = true;
              } else {
                this.passengers[index].passenger.isSelected = false;
              }
            }
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
        { data: "autoIncrementID" },
        { data: "uniqueID", orderable: false },
        { data: "email" },
        { data: "name" },
        { data: "countryCode" },
        { data: "onlyPhoneNumber" },
        { data: "dob", searchable: false },
        { data: "createdAt", searchable: false },
        { data: "profilePhoto", orderable: false },
        { data: "profilePhoto",searchable: false },
        { data: "phoneNumber"},
        { data: "actions", orderable: false, searchable: false }
      ]
    };
  }
  imgErrorHandler(event) {
    event.target.src = this.profilePhotoUrl + 'default.png';
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

  blockUnblockDriver(driver: any) {
    let text;
    if (driver.isBlocked) {
      text = 'You want to unblock this driver ?';
    } else {
      text = 'You want to block this driver ?';
    }

    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
      if (willDelete && !willDelete.dismiss) {
        let data = {
          'driver_id': driver._id
        }
        this.driverService.blockUnblockDriver(data).subscribe(
          next => {
            if (next.status_code == 200) {
              this.rerender();
              if (driver.isBlocked) {
                Swal('Success', "Driver unblocked successfully.", 'success');
              } else {
                Swal('Success', "Driver blocked successfully.", 'success');
              }
            } else {
              Swal('Success', "Driver status is not updated.", 'success');
            }
          },
          error => {
            Swal('Success', "Driver status is not updated.", 'success');
          }
        );
      } else {

      }
    });
  }
  backHierarchy(){
    this.location.back();
    setTimeout(() => {
      if (this.router.url == '/hierarchys/passenger-hierarchy' || this.router.url == '/passenger/list-passenger') {
        this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
          dtInstance.destroy();
        });
      } else {
        this.rerender();
      }
    }, 500);
    // this.router.navigate(['/profile', btoa(user_id)],{ queryParams: { salon_title: 'salons' } });
  }
  levelnotfound() {
    Swal({
      title: 'Bottom line !!',
      // text: 'Passenger next level not found',
      type: 'info',
      showCloseButton: true,
      showCancelButton: false
    }).then((willDelete) => {
      
    });
  }

  verifyUnverifyDriver(driver: any) {
    let text;
    if (driver.isVerified) {
      text = 'You want to unverify this driver ?';
    } else {
      text = 'You want to verify this driver ?';
    }

    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
      if (willDelete && !willDelete.dismiss) {
        let data = {
          'driver_id': driver._id
        }
        this.driverService.verifyUnverifyDriver(data).subscribe(
          next => {
            if (next.status_code == 200) {
              this.rerender();
              if (driver.isVerified) {
                Swal('Success', "Driver status unverified successfully.", 'success');
              } else {
                Swal('Success', "Driver status verified successfully.", 'success');
              }
            } else {
              Swal('Success', "Driver status is not updated.", 'success');
            }
          },
          error => {
            Swal('Error', "Driver status is not updated", 'error');
          }
        );
      } else {

      }
    });
  }

  rerenderTable() {
    this.rerender();
  }

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
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
