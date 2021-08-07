import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Validation } from '../../helper/validation';
import { SettingService } from '../../services/setting.service';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router, ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-admin-setting',
  templateUrl: './admin-setting.component.html'
})
export class AdminSettingComponent implements OnInit {
  public basicContent: string;
  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  action: string = 'view';
  position = 'bottom-right';
  adminFeeForm: FormGroup;
  adminMinBalanceForm: FormGroup;
  adminForceAppForm: FormGroup;
  adminForceAppForms: FormGroup;
  isSubmitted: boolean = false;
  extension: any;
  termData: any;
  feeData: any = {};

  constructor(
    private validation: Validation,
    private settingService: SettingService,
    private toastyService: ToastyService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.adminFeeForm = new FormGroup({
      admin_fee: new FormControl("", [Validators.required, Validators.minLength(1), Validators.maxLength(8), Validators.pattern(this.validation.integer)]),
    });
    this.adminMinBalanceForm = new FormGroup({
      minimum_balance: new FormControl("", [Validators.required, Validators.minLength(1), Validators.maxLength(8), Validators.pattern(this.validation.integer)]),
    });
    this.adminForceAppForm = new FormGroup({
      new_version_ios: new FormControl("", [Validators.required, Validators.minLength(1), Validators.maxLength(8), Validators.pattern(this.validation.float)]),
      new_version_android: new FormControl("", [Validators.required, Validators.minLength(1), Validators.maxLength(8), Validators.pattern(this.validation.float)]),
      force_update: new FormControl("", [])
    });
    this.adminForceAppForms = new FormGroup({
      new_version_ios: new FormControl("", [Validators.required, Validators.minLength(1), Validators.maxLength(8), Validators.pattern(this.validation.float)]),
      new_version_android: new FormControl("", [Validators.required, Validators.minLength(1), Validators.maxLength(8), Validators.pattern(this.validation.float)]),
      force_update: new FormControl("", [])
    });
    this.getAdminFee();
    this.GetTermAndConditionData();
  }

  getAdminFee() {
    this.loading = true;
    let demo = "admin Fee";
    this.settingService.GetAdminFee(demo).subscribe(
      respone => {
        this.loading = false;
        this.feeData = respone.data;
        this.adminFeeForm.setValue({
          admin_fee: this.feeData.adminFee + '',
        });
        this.adminMinBalanceForm.setValue({
          minimum_balance: this.feeData.driverMinimumBalance != 0 ? this.feeData.driverMinimumBalance :"0",
        });
        this.adminForceAppForm.setValue({
          new_version_android: this.feeData.driverVersionUpdate.new_version_android,
          new_version_ios: this.feeData.driverVersionUpdate.new_version_ios,
          force_update: this.feeData.driverVersionUpdate.force_update,
        });
        this.adminForceAppForms.setValue({
          new_version_android: this.feeData.passengerVersionUpdate.new_version_android,
          new_version_ios: this.feeData.passengerVersionUpdate.new_version_ios,
          force_update: this.feeData.passengerVersionUpdate.force_update,
        });
      },
      error => {
        this.loading = false;
        // this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }


  GetTermAndConditionData() {
    this.loading = true;
    this.settingService.GetCMSData().subscribe(
      respone => {
        this.loading = false;
        this.termData = respone.data;
        this.basicContent = this.termData[0].termAndCondition;
      },
      error => {
        this.loading = false;
        this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
      }
    );
  }
  updateTermAndConditionData() {
    this.loading = true;

    let update_term_and_condition = {
      'term_and_condition': this.basicContent
    }

    this.settingService.UpdateTermAndConditionData(update_term_and_condition)
      .subscribe(next => {
        this.loading = false;
        this.isSubmitted = false;
        if (next.status_code == 200) {
          this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.adminFeeForm.valid) {
      this.loading = true;
      this.settingService.UpdateAdminFee(this.adminFeeForm.value)
        .subscribe(next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
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

  onForceAppFormSubmit() {
    this.isSubmitted = true;
    if (this.adminForceAppForm.valid) {
      this.loading = true;
      let update_verData = { new_version_android: this.adminForceAppForm.value.new_version_android, new_version_ios: this.adminForceAppForm.value.new_version_ios, force_update: this.adminForceAppForm.value.force_update }
      this.settingService.DriverVersionUpdate(update_verData)
        .subscribe(next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
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
  onpassengerForceAppFormSubmit() {
    this.isSubmitted = true;
    if (this.adminForceAppForms.valid) {
      this.loading = true;
      let update_verData = { new_version_android: this.adminForceAppForms.value.new_version_android, new_version_ios: this.adminForceAppForms.value.new_version_ios, force_update: this.adminForceAppForms.value.force_update }
      this.settingService.PassengerVersionUpdate(update_verData)
        .subscribe(next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
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

  onBalanceFormSubmit() {
    this.isSubmitted = true;
    if (this.adminMinBalanceForm.valid) {
      this.loading = true;
      this.settingService.UpdateDriverMinimumBalance(this.adminMinBalanceForm.value)
        .subscribe(next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
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


}
