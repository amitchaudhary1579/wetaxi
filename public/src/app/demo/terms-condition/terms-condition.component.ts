import { Component, OnInit } from '@angular/core';
import { SettingService } from '../services/setting.service';
import { ToastyService, ToastData, ToastOptions } from 'ng2-toasty';

@Component({
  selector: 'app-terms-condition',
  templateUrl: './terms-condition.component.html'
})
export class TermsConditionComponent implements OnInit {
  public loading = false;
  termData: any;
  public basicContent: string;
  position = 'bottom-right';

  constructor(
    private settingService: SettingService,
    private toastyService: ToastyService,
  ) { }

  ngOnInit() {
    this.GetTermAndConditionData();
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
