import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { DriverService, AuthService } from '../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { environment } from 'src/environments/environment';
import * as moment from 'moment';
import { ActionLogsService } from '../services/action-logs.service';
import { ExcelService } from '../services/excel.service';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { NotifyService } from '../services/notify.service';
@Component({
  selector: 'app-notification-logs',
  templateUrl: './notification-logs.component.html'
})
export class NotificationLogsComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  position = 'bottom-right';
  exportActionLogExcel = [];
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();
  notificationLogData;
  profilePhotoUrl: any;
  balanceData: any;
  logOpenId: any;
  notifyData: any;
  submitted = false;
  filterForm = this.fb.group({
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required]
  });
  filterValue: any = {};
  public isSubmitted: boolean = false;
  @ViewChild('closeBtn') closeBtn;
  @ViewChild('modalDefault') modalDefault;
  constructor(
    private toastyService: ToastyService,
    private authService: AuthService,
    private actionLogsService: ActionLogsService,
    private notifyService: NotifyService,
    private excelService: ExcelService,
    private fb: FormBuilder,
    config: NgbDatepickerConfig,
  ) {
    config.minDate = { year: 1900, month: 1, day: 1 };
    config.maxDate = { year: (new Date()).getFullYear(), month: (new Date()).getMonth() + 1, day: (new Date()).getDate() };
  }

  ngOnInit() {
    this.profilePhotoUrl = environment.profileImageUrl;
    this.authService.clearDataTableData("DataTables_driver_management");
    this.loading = true;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      serverSide: true,
      order: [0, 'desc'],
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
        this.notifyService.ListOfAllNotificationLogs(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.notificationLogData = resp.data;
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
        { data: "title" },
        { data: "receiver_type" },
        { data: "note" },
        { data: "type" },
        { data: "createdAt", searchable: false },
      ]
    };
  }

  openModals(logId) {
    this.logOpenId = logId;
    this.logUserDetails(logId);
    this.isSubmitted = false;
    this.modalDefault.show();
  }

  
  copyText(val: string){
    let selBox = document.createElement('textarea');
      selBox.style.position = 'fixed';
      selBox.style.left = '0';
      selBox.style.top = '0';
      selBox.style.opacity = '0';
      selBox.value = val;
      document.body.appendChild(selBox);
      selBox.focus();
      selBox.select();
      document.execCommand('copy');
      document.body.removeChild(selBox);
      this.addToast({ title: 'Success', msg: "Note has been copied to clipboard successfully", timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
    }

  logUserDetails(logId) {
    this.loading = true;
    let notificationLogId = {
      'notificationLog_id': logId
    }
    this.notifyService.getNotificationLogsUserList(notificationLogId).subscribe(
      respone => {
        this.loading = false;
        this.notifyData = respone.data;
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

  imgErrorHandler(event) {
    event.target.src = this.profilePhotoUrl + 'default.png';
  }

  exportAsXLSX_Actionlog() {
    this.actionLogsService.ListOfallActionLog({}).subscribe(
      resp => {
        resp.data.map(element => {
          this.exportActionLogExcel.push({ 'AutoId': element.autoIncrementID, 'UserName': element.userName, 'UserType': element.userType, 'Action': element.action, 'Section': element.section, 'CreatedAt': moment(element.createdAt).format('YYYY-MM-DD, h:mm a') })
        });
        this.excelService.exportAsExcelFile(this.exportActionLogExcel, 'ActionLogs');
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

  resendNotification() {
    this.loading = true;
    let notificationResendId = {
      'notificationLog_id': this.logOpenId
    }
    this.notifyService.sendNotificationFromNotificationLogs(notificationResendId).subscribe(
      respone => {
        this.loading = false;
        this.addToast({ title: 'Success', msg: respone.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
        this.modalDefault.hide();

      },
      error => {
        this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
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
