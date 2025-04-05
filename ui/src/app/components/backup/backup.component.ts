import {Component, OnInit} from '@angular/core';
import {CongregationService} from "../../services/congregation.service";
import {BackupFile} from "../../domains/BackupFile";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.scss']
})
export class BackupComponent implements OnInit {

  loading: boolean = false;
  loadingText: string = '... loading ';
  backupFiles: BackupFile[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private congregationService: CongregationService
  ) {
  }

  ngOnInit(): void {
    this.loadBackups();
  }

  loadBackups() {
    this.loading = true;
    this.loadingTextChange();
    this.congregationService.getBackupFiles().subscribe((files: BackupFile[]) => {
      this.backupFiles = files;
      this.loading = false;
    })
  }

  loadingTextChange() {
    if (this.loading) {
      setTimeout(() => {
        this.loadingTextChange()
      }, 500);

      this.loadingText += ".";
    } else {
      this.loadingText = "... loading ";
    }
  }

  restoreBackup(b: BackupFile) {
    this.congregationService.restoreBackup(b).subscribe(() => {
      this.router.navigate(['TERRITORIES']);
    })
  }

  deleteBackup(b: BackupFile) {
    this.congregationService.deleteBackup(b).subscribe(()=> {
      this.backupFiles.forEach( (item, index) => {
        if(item === b) this.backupFiles.splice(index,1);
      });
    })
  }
}
