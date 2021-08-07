import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Validation } from '../helper/validation';
import { NotifyService } from '../services/notify.service';
import { ToastyService, ToastOptions, ToastData } from 'ng2-toasty';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  submitted: boolean = false;
  adminDetails: any;
  position = 'bottom-right';

  constructor(
    public notifyService: NotifyService,
    public router: Router,
    public toastyService: ToastyService,
    public validation: Validation
  ) { }

  ngOnInit() {
    this.changePasswordForm = new FormGroup({
      currentPassword: new FormControl("", [
        Validators.required,
        Validators.pattern(this.validation.sapce_pattern)
      ]),
      newPassword: new FormControl("", [
        Validators.required,
        Validators.pattern(this.validation.sapce_pattern),
        Validators.minLength(6),
        Validators.maxLength(16)
      ]),
      confPassword: new FormControl("", [Validators.required])
    });
  }

  changePasswordFormSubmit(): void {
    this.submitted = true;
    if (
      this.changePasswordForm.valid &&
      this.changePasswordForm.value.newPassword ==
      this.changePasswordForm.value.confPassword
    ) {
      let sendDataToApi = {
        old_password: this.changePasswordForm.value.currentPassword,
        new_password: this.changePasswordForm.value.newPassword
      };

      this.notifyService.changePassword(sendDataToApi).subscribe(
        response => {
          if (response.status_code == 200) {
            this.addToast({ title: 'Success', msg: response.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'success' });
            this.router.navigate(["/dashboard"]);
          } else {
            this.addToast({ title: 'Error', msg: response.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
          }
        },
        error => {
          this.addToast({ title: 'Error', msg: error.message, timeout: 5000, theme: 'default', position: 'bottom-right', type: 'error' });
        }
      );
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

}
