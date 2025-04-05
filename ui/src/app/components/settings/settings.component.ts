// @ts-nocheck
import { Component, OnInit } from '@angular/core';
import {FormControl} from "@angular/forms";
import {Settings} from "../../domains/Settings";
import {SettingsService} from "../../services/settings.service";
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  settings:Settings|null = null;
  ftpUser = new FormControl('');
  ftpPassword = new FormControl('');
  ftpHost = new FormControl('');
  ftpPort = new FormControl('');
  knownHosts = new FormControl('');
  rootPath = new FormControl('');
  httpHost = new FormControl('');
  sftp = new FormControl(false);
  sync = new FormControl(false);
  syncPassword = new FormControl('');
  whatsApp = new FormControl('');
  whatsAppNote = new FormControl('');

  whatsAppDashboard = new FormControl('');

  constructor(private settingsService:SettingsService) { }

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe( (s: Settings | null) => {
      this.settings = s;
      if (this.settings != null) {
        this.ftpUser.setValue(s.settings['ftp.user']);
        this.ftpPassword.setValue(s.settings['ftp.password']);
        this.ftpHost.setValue(s.settings['ftp.host']);
        this.ftpPort.setValue(s.settings['ftp.port']);
        this.knownHosts.setValue(s.settings['ftp.knownHosts']);
        this.rootPath.setValue(s.settings['ftp.rootPath']);
        this.httpHost.setValue(s.settings['ftp.httpHost']);

        if ('true' == s.settings['ftp.sftp'])
          this.sftp.setValue(true);
        else
          this.sftp.setValue(false);

        if ('true' == s.settings['ftp.sync'])
          this.sync.setValue(true);
        else
          this.sync.setValue(false);

        this.syncPassword.setValue(s.settings['ftp.syncPassword']);
        this.whatsApp.setValue(s.settings['text.whatsApp']);
        this.whatsAppNote.setValue(s.settings['text.whatsApp.note']);
        this.whatsAppDashboard.setValue(s.settings['text.whatsApp.dashboard']);
      }
    });
  }

  public save():void {
    if (this.settings != null) {
      this.settings.settings['ftp.user'] = this.ftpUser.value;
      this.settings.settings['ftp.password'] = this.ftpPassword.value;
      this.settings.settings['ftp.host'] = this.ftpHost.value;
      this.settings.settings['ftp.port'] = this.ftpPort.value;
      this.settings.settings['ftp.knownHosts'] = this.knownHosts.value;
      this.settings.settings['ftp.rootPath'] = this.rootPath.value;
      this.settings.settings['ftp.httpHost'] = this.httpHost.value;

      if (this.sftp.value)
        this.settings.settings['ftp.sftp'] = 'true';
      else
        this.settings.settings['ftp.sftp'] = 'false';

      if (this.sync.value)
        this.settings.settings['ftp.sync'] = 'true';
      else
        this.settings.settings['ftp.sync'] = 'false';

      this.settings.settings['ftp.syncPassword'] = this.syncPassword.value;
      this.settings.settings['text.whatsApp'] = this.whatsApp.value;
      this.settings.settings['text.whatsApp.note'] = this.whatsAppNote.value;
      this.settings.settings['text.whatsApp.dashboard'] = this.whatsAppDashboard.value;
      console.log(this.settings)
      this.settingsService.saveSettings(this.settings).subscribe((s: Settings | null) => this.settings = s);
    }
  }

  createUniquePassword() {
    let password = uuid() + uuid();
    if (password.length == 72)
      this.syncPassword.setValue(password);
  }
}
