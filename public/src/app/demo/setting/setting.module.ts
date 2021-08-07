import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { FileValidator } from '../helper/file-input.validator';
import { SelectModule } from 'ng-select';
import { SettingRoutingModule } from './setting-routing.module';
import { AdminSettingComponent } from './admin-setting/admin-setting.component';
import {TinymceModule} from 'angular2-tinymce';


@NgModule({
  imports: [
    CommonModule,
    SettingRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgbDropdownModule,
    NgxLoadingModule,
    InputTrimModule,
    NgbDatepickerModule,
    SelectModule,
    TinymceModule
  ],
  declarations: [ AdminSettingComponent ],
  providers: [ FileValidator ]
})

export class SettingModule { }
