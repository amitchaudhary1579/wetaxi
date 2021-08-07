import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTablesModule } from 'angular-datatables';
import { FormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { NgxLoadingModule } from 'ngx-loading';
import { InputTrimModule } from 'ng2-trim-directive';
import { HelpcenterRoutingModule } from './help-center-routing.module';
import { ListHelpcenterComponent } from './list-help-center/list-help-center.component';
import { AgmCoreModule } from '@agm/core';
import { ViewHelpcenterComponent } from './view-help-center/view-help-center.component';
import { AddHelpCenterComponent } from './add-help-center/add-help-center.component';

@NgModule({
  imports: [
    CommonModule,
    HelpcenterRoutingModule,
    SharedModule,
    FormsModule,
    DataTablesModule,
    NgxLoadingModule.forRoot({}),
    InputTrimModule,
    AgmCoreModule.forRoot({apiKey: 'AIzaSyACc3dJSHi6_oE4nKOg3H-HQ_znaFLWcHw'})
  ],
  declarations: [ListHelpcenterComponent, ViewHelpcenterComponent, AddHelpCenterComponent]
})

export class HelpcenterModule { }
