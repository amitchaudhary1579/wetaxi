import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { ToastyModule } from 'ng2-toasty';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgxLoadingModule } from 'ngx-loading';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { CustomFormsModule } from 'ng2-validation';

@NgModule({
  imports: [
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    ToastyModule,
    InputTrimModule,
    NgxLoadingModule.forRoot({}),
    CustomFormsModule,
    LoginRoutingModule
  ],
  declarations: [LoginComponent]
})
export class LoginModule { }
