import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { ToastOptions, ToastData, ToastyService } from 'ng2-toasty';
import { CreditService, AuthService } from '../../services';
import { RewardService } from '../../services/reward.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbDatepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

@Component({
  selector: 'app-view-driver-rewards',
  templateUrl: './view-driver-rewards.component.html'
})
export class ViewDriverRewardsComponent implements OnInit {

  profileImageUrl: any;
  driver_id: any;
  diver_reward: any;
  public loading = false;
  driverData: any = {};
  driverName: string;
  position = 'bottom-right';
  dtOptions: DataTables.Settings = {};
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtTrigger: Subject<any> = new Subject();@ViewChild(DataTableDirective)
  @ViewChild('closeBtn') closeBtn;
  @ViewChild('myPersistenceModal') myPersistenceModal;

  submitted = false;
  filterForm = this.fb.group({
    fromDate: ['', Validators.required],
    toDate: ['', Validators.required]
  });
  filterValue: any = {};
  constructor(
    private route: ActivatedRoute,
    private creditService: CreditService,
    private toastyService: ToastyService,
    private authService: AuthService,
    private rewardService: RewardService,
    private fb: FormBuilder,
    config: NgbDatepickerConfig,
  ) {
    config.minDate = { year: 1900, month: 1, day: 1 };
    config.maxDate = { year: (new Date()).getFullYear(), month: (new Date()).getMonth() + 1, day: (new Date()).getDate() };
  }

  ngOnInit() {
    this.profileImageUrl = environment.profileImageUrl;
    this.route.params.subscribe(params => {
      this.driver_id =params.driver_id;
    });
    this.getDriverDetails();
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
        dataTablesParameters.driver_id = this.driver_id;
        dataTablesParameters.filter = this.filterValue;
        this.rewardService.ListOfAllDriversReward(dataTablesParameters).subscribe(
          resp => {
            this.loading = false;
            this.diver_reward = resp.data;
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
        { data: "id" , orderable: false },
        { data: "date"},
        { data: "reward_title"},
        { data: "reward_type"  },
        { data: "gift_type"  },
        { data: "reward_value" },
        { data: "is_rewarded" },
      ]
    };
  }

  imgErrorHandler(event){
    event.target.src = this.profileImageUrl + 'default.png';
  }
  receive_reward(operator: any) {
    let text;
      text = 'you want to update status to : Is rewarded to true';
    Swal({
      title: 'Are you sure?',
      text: text,
      type: 'warning',
      showCloseButton: true,
      showCancelButton: true
    }).then((willDelete) => {
        if (willDelete && !willDelete.dismiss) {
          let data = {
            'rewardId': operator._id
          }
          this.rewardService.IsRewardRecive(data).subscribe(
            next => {
             if(next.status_code == 200) {
               this.rerender();
               if(operator.isActive) {
                Swal('Success', " Is rewarded Status Chnage successfully.", 'success');
              } else {
                Swal('Success', " Is rewarded Status Chnage successfully.", 'success');
              }
             } else {
              Swal('Error', "Is rewarded Status is not updated.", 'error');
             }
            },
            error => {
              Swal('Error', "Is rewarded Status is not updated.", 'error');
            }
          );
        } else { }
      });
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
