import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import {DriverRideService } from '../../services/driver-ride.service';


@Component({
  selector: 'app-single-view-driver-ride',
  templateUrl: './single-view-driver-ride.component.html'
})
export class SingleViewDriverRideComponent implements OnInit {
public ride_id:any;
public get_ride_information:any;
profileImageUrl: any;
get_driver_id: any;

  constructor(
    private route: ActivatedRoute,
    private driverRewardService: DriverRideService
    
  ) { }

  ngOnInit() {
    this.profileImageUrl = environment.profileImageUrl;
    this.route.params.subscribe(params => {
      this.ride_id = params.driver_id;
    });
    this.route.queryParams.subscribe(queryParams => {
      this.get_driver_id = queryParams.DriverId;
    });
    this.getDriverDetails();
  }
  getDriverDetails() {
    let driverData = {
      'ride_id': this.ride_id
    }
      this.driverRewardService.SingleListOfAllDriversRide(driverData).subscribe(
      respone => {
        this.get_ride_information = respone.data;
      },
      error => {
        console.log('error: ', error);
      }
    );
  }

}
