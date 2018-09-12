import { Component, OnInit } from "@angular/core";
import { getNumber, getString } from "application-settings";
import { RouterExtensions } from "nativescript-angular/router";
import { DatabaseService } from "../../core/sqlite.service";
import { prompt, PromptResult, inputType, PromptOptions } from "ui/dialogs";
import { confirm } from "ui/dialogs";

@Component({
	selector: "Tasklist",
	moduleId: module.id,
	templateUrl: "./tasklist.component.html",
	styleUrls: ['./tasklist.component.css']
})
export class TasklistComponent implements OnInit {

	db: any;
	listid: number;
	listname: string;

	public tasks: Array<any>;

	constructor(
		private routerExtensions: RouterExtensions,
		private database: DatabaseService
	) {
		this.tasks = [];
		this.listid = getNumber("id");
		this.listname = getString("listname");
	}

	ngOnInit(): void {
		console.log("listid : ", this.listid)
		this.selecttask();
	}

	createtask() {
		let options: PromptOptions = {
			title: "Note name",
			inputType: inputType.text,
			okButtonText: "OK",
			cancelButtonText: "Cancel",
			cancelable: true
		};

		prompt(options).then((result: PromptResult) => {
			console.log("Note name : " + JSON.stringify(result));
			if (result.result) {
				if (result.text.length > 0) {
					this.db.execSQL("INSERT INTO tasks (list_id, task_name) VALUES (?, ?)", [this.listid, result.text]).then(id => {
						this.tasks.push({ id: id, task_name: result.text });
					}, error => {
						console.log("INSERT ERROR", error);
					});
				}
				else {
					alert("Please enter the note name!");
					return;
				}
			}
		});
	}

	selecttask() {
		this.tasks.length = 0;
		this.database.getdbConnection()
			.then(db => {
				db.all("SELECT id, task_name FROM tasks WHERE list_id = ?", [this.listid]).then(rows => {
					for (var row in rows) {
						this.tasks.push({ id: rows[row][0], task_name: rows[row][1] });
					}
					this.db = db;
				}, error => {
					console.log("SELECT ERROR", error);
				});
			});
	}

	edittask(task) {
		let options: PromptOptions = {
			title: "Edit note name",
			defaultText: task.task_name,
			inputType: inputType.text,
			okButtonText: "OK",
			cancelButtonText: "Cancel",
			cancelable: true
		};

		prompt(options).then((result: PromptResult) => {
			console.log("edit note name : " + JSON.stringify(result));
			if (result.result) {
				if (result.text.length > 0) {

					this.db.execSQL("UPDATE tasks SET task_name=? WHERE id=?", [result.text, task.id]).then(() => {
						console.log(task.task_name.toUpperCase() + " Note updated successfully!");
						this.selecttask();
					});
				}
				else {
					alert("Please edit the note name to update!");
					return;
				}
			}
		});
	}

	deletetask(task, index) {
		let options = {
			title: "Note Deletion",
			message: "Do you want to delete the note?",
			okButtonText: "Yes",
			cancelButtonText: "No",
			neutralButtonText: "Cancel"
		};

		confirm(options).then((result: boolean) => {
			console.log(result);
			if (result) {
				this.db.execSQL("DELETE FROM tasks WHERE id=?", [task.id]).then(() => {
					console.log(task.task_name.toUpperCase() + " Note deleted successfully!")
				});

				this.tasks.splice(index, 1);
			}
		});
	}

	public goBack() {
		this.routerExtensions.back();
	}
}