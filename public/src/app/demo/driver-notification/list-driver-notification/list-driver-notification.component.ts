import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DriverService, AuthService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { SettingService } from '../../services/setting.service';
import { NotifyService } from '../../services/notify.service';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { Validation } from '../../helper/validation';

@Component({
  selector: 'app-list-driver-notification',
  templateUrl: './list-driver-notification.component.html',
  // template:`<app-view-driver-notification [parentCount]="primaryColour"></app-view-driver-notification>`
})
export class ListDriverNotificationComponent implements OnInit {
  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  @ViewChild('closeBtn') closeBtn;
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  drivers;
  profilePhotoUrl: any;
  balanceData: any;
  isSubmitted: boolean = false;
  isAllSubmitted: boolean = false;
  isclosebutton: boolean = false;
  public masterSelected = false;
  public DeleteDisabled = false;
  checkedList: any;
  statusList = [];
  notificationForm: FormGroup;
  notificationForms: FormGroup;
  profileImageUrl: any;
  @ViewChild('modalDefault1') modalDefault1;
  @ViewChild('modalDefault') modalDefault;
  constructor(
    private driverService: DriverService,
    private toastyService: ToastyService,
    private authService: AuthService,
    private settingService: SettingService,
    private notifyService: NotifyService,
    private validation: Validation,
  ) { }

  ngOnInit() {
    this.notificationForm = new FormGroup({
      message: new FormControl("", [Validators.required]),
      title: new FormControl("", [
        Validators.required,
        // Validators.pattern(this.validation.alpha_numeric_space),
        Validators.minLength(1),
        Validators.maxLength(45)
      ]),
    });
    this.notificationForms = new FormGroup({
      message: new FormControl("", [Validators.required]),
      title: new FormControl("", [
        Validators.required,
        // Validators.pattern(this.validation.alpha_numeric_space),
        Validators.minLength(1),
        Validators.maxLength(35)
      ]),
    });
    this.getLowBalance();
    this.profilePhotoUrl = environment.profileImageUrl;
    this.authService.clearDataTableData("DataTables_driver_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      order: [1, "desc"],
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
            for (let index = 0; index < this.drivers.length; index++) {
              this.drivers[index].isCheck = false;
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
        { data: "checkid", orderable: false },
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
        { data: "profilePhoto", orderable: false }
        // { data: "actions", orderable: false, searchable: false }
      ]
    };
  }
  openModal() {
    this.isSubmitted = false;
    this.notificationForms.reset();
    this.modalDefault1.show();
  }
  openModals() {
    this.isSubmitted = false;
    this.notificationForm.reset();
    this.modalDefault.show();
  }
  checkUncheckAll() {
    for (var i = 0; i < this.drivers.length; i++) {
      this.drivers[i].isCheck = this.masterSelected;
    }
    this.getCheckedItemList();
  }

  isAllSelected() {
    this.masterSelected = this.drivers.every(function (item: any) {
      return item.isCheck == true;
    })
    this.getCheckedItemList();
  }

  getCheckedItemList() {
    this.checkedList = [];
    for (var i = 0; i < this.drivers.length; i++) {
      if (this.drivers[i].isCheck)
        this.checkedList.push(this.drivers[i]._id);
    }
    this.checkedList = JSON.stringify(this.checkedList);
    if (this.checkedList.length > 0) {
      this.DeleteDisabled = false;
    } else {
      this.DeleteDisabled = true;
    }
    this.statusList = JSON.parse(this.checkedList);
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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.notificationForm.valid) {
      this.loading = true;
      let senddata = { ...this.notificationForm.value, ids: this.checkedList }
      this.notifyService.SendNotificationToDriver(senddata)
        .subscribe(next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.modalDefault.hide();
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
            this.notificationForm.reset();
          } else {
            this.addToast({ title: 'Error', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          }
        },
          error => {
            this.loading = false;
            this.isSubmitted = false;
            this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          })
    }
  }

  onNotificationFormSubmit() {
    this.isAllSubmitted = true;
    if (this.notificationForms.valid) {
      this.loading = true;
      let senddata = { ...this.notificationForms.value, flag: 'all' }
      this.notifyService.SendNotificationToDriver(senddata)
        .subscribe(next => {
          this.loading = false;
          this.isAllSubmitted = false;
          if (next.status_code == 200) {
            this.modalDefault1.hide();
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
            this.notificationForms.reset();
          } else {
            this.addToast({ title: 'Error', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          }
        },
          error => {
            this.loading = false;
            this.isAllSubmitted = false;
            this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
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
  imgErrorHandler(event) {
    event.target.src = this.profilePhotoUrl + 'default.png';
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

  ngAfterViewInit(): void {
    this.dtTrigger.next();
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next();
    });
  }
}
