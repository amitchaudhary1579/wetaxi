import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Validation } from '../../helper/validation';
import { HelpCenterService } from '../../services';
import { ToastData, ToastOptions, ToastyService } from 'ng2-toasty';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-help-center',
  templateUrl: './add-help-center.component.html'
})
export class AddHelpCenterComponent implements OnInit {

  public loading = false;
  public primaryColour = "#ffffff";
  public secondaryColour = "#ffffff";
  action: string = 'view';
  position = 'bottom-right';
  viewHelpCenterForm: FormGroup;
  isSubmitted: boolean = false;
  extension: any;
  helpCenterData: any = {};

  constructor(
    private validation: Validation,
    private helpCenterService: HelpCenterService,
    private toastyService: ToastyService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.viewHelpCenterForm = new FormGroup({
      email: new FormControl("", [Validators.required, Validators.pattern(this.validation.email)]),
      phoneNumber: new FormControl("", [Validators.required, Validators.minLength(8), Validators.maxLength(16), Validators.pattern(this.validation.integer)]),
      // fbUrl: new FormControl("", [Validators.required, Validators.pattern(this.validation.url_pattern)])
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

  onFormSubmit() {
    this.isSubmitted = true;
    if (this.viewHelpCenterForm.valid) {
      this.loading = true;
      this.helpCenterService.addHelpCenterDetails(this.viewHelpCenterForm.value)
        .subscribe(next => {
          this.loading = false;
          this.isSubmitted = false;
          if (next.status_code == 200) {
            this.addToast({ title: 'Success', msg: next.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
            this.router.navigate(["/help-center/list-help-center"]);
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
