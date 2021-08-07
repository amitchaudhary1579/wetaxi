import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DriverService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { SettingService } from '../../services/setting.service';
import { ExcelService } from '../../services/excel.service';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'list-driver',
  templateUrl: './list-driver.component.html'
})
export class ListDriverComponent implements AfterViewInit, OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  drivers;
  exportDriverExcel = [];
  profilePhotoUrl: any;
  admin_id: any;
  balanceData: any;
  submitted = false;
  filterForm = this.fb.group({
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required]
  });
  filterValue: any = {};
  constructor(
    private driverService: DriverService,
    private toastyService: ToastyService,
    private authService: AuthService,
    private settingService: SettingService,
    private excelService: ExcelService,
    private fb: FormBuilder,
    config: NgbDatepickerConfig,
  ) {
    config.minDate = { year: 1900, month: 1, day: 1 };
    config.maxDate = { year: (new Date()).getFullYear(), month: (new Date()).getMonth() + 1, day: (new Date()).getDate() };
  }

  ngOnInit() {
    this.admin_id = JSON.parse(localStorage.getItem('adminData'));
    this.getLowBalance();
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
        dataTablesParameters.filter = this.filterValue;
        this.driverService.ListOfAllDrivers(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.drivers = resp.data;
            for (let index = 0; index < this.drivers.length; index++) {
              if (this.balanceData >= this.drivers[index].creditBalance) {
                this.drivers[index].isSame = true;
              } else {
                this.drivers[index].isSame = false;
              }
            }
            for (let index = 0; index < this.drivers.length; index++) {
              if (moment().format('D') == moment(this.drivers[index].dob).format('D') && moment().format('MMMM') == moment(this.drivers[index].dob).format('MMMM')) {
                this.drivers[index].isSelected = true;
              } else {
                this.drivers[index].isSelected = false;
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
            // this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
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
        { data: "avgRating" },
        { data: "creditBalance" },
        { data: "dob", searchable: false },
        { data: "createdAt", searchable: false },
        { data: "profilePhoto", orderable: false },
        { data: "isVerified", orderable: false, searchable: false },
        { data: "actions", orderable: false, searchable: false },
        { data: "refferal hierarchy actions", orderable: false, searchable: false },
        { data: "refferal earning actions", orderable: false, searchable: false },
        { data: "ride actions", orderable: false, searchable: false }
      ]
    };
  }
  imgErrorHandler(event) {
    event.target.src = this.profilePhotoUrl + 'default.png';
  }

  levelnotfound() {
    Swal({
      title: 'Bottom line !!',
      type: 'info',
      showCloseButton: true,
      showCancelButton: false
    }).then((willDelete) => {
    });
  }

  getLowBalance() {
    this.loading = true;
    let demo = "admin Fee";
    this.settingService.GetAdminFee(demo).subscribe(
      respone => {
        this.loading = false;
        this.balanceData = respone.data.driverMinimumBalance;
      },
      error => {
        this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }

  exportAsXLSX_Driver() {
    this.driverService.ListOfAllDrivers({ filter: this.filterValue }).subscribe(
      resp => {
        resp.data.map(element => {
          this.exportDriverExcel.push({ 'VehicleId': element.uniqueID, 'Email': element.email, 'Name': element.name, 'CountryCode': element.countryCode, 'PhoneNumber': element.onlyPhoneNumber, 'Ratting': element.avgRating, 'credit': element.creditBalance, 'Status': element.isVerified ? "Verify" : "Unverify", 'DateOfBirth': element.dob, 'RegisterDate': moment(element.createdAt).format('YYYY-MM-DD'), 'TotalInvitedCount': element.totalInvitedCount, 'TotalReferralEarning': element.totalReferralEarning, 'TotalRideEarning': element.totalRideEarning })
        });
        this.excelService.exportAsExcelFile(this.exportDriverExcel, 'DriverDetails');
      },
      error => {
        this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
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
          'driver_id': driver._id,
          'admin_id': this.admin_id.admin_id
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

