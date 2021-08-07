import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ToastyModule } from 'ng2-toasty';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgxLoadingModule } from 'ngx-loading';
import { CustomFormsModule } from 'ng2-validation';
import { ChangePasswordComponent } from './change-password.component';
import { ChangePasswordRoutingModule } from './change-password-routing.module';

@NgModule({
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    ToastyModule,
    InputTrimModule,
    NgxLoadingModule.forRoot({}),
    CustomFormsModule,
    ChangePasswordRoutingModule
  ],
  declarations: [ChangePasswordComponent]
})
export class ChangePasswordModule { }
