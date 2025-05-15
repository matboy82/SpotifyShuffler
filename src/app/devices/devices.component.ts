import { Component, OnInit } from '@angular/core';
import { DeviceService } from '../device.service';

@Component({
    selector: 'app-devices',
    imports: [],
    templateUrl: './devices.component.html',
    styleUrl: './devices.component.scss'
})
export class DevicesComponent implements OnInit{
  // TODO display a list of devices, allows selecting a device to playback on
  constructor(private deviceService: DeviceService) { }

  ngOnInit(): void {
      this.deviceService.getDevices().subscribe((devices) => {
        console.log(devices);
      })
  }
}
