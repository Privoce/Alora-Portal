import {remove, restore, save} from './storage';

class NotesManager {
    notes;
    #isSynced;

    constructor() {
        this.#isSynced = false;
        restore("notes").then((it) => {
            this.#isSynced = true;
            this.notes = it["notes"] ? it["notes"] : [];
        });
    }

    async addOne(id) {
        return new Promise(resolve => {
            const timer = setInterval(async () => {
                if (!this.#isSynced) return;
                clearInterval(timer);
                const newNotes = await restore("notes");
                console.log(this.notes)
                this.notes = newNotes["notes"] ? newNotes["notes"] : this.notes;
                this.notes.push(id);
                save("", id);
                this.#isSynced = false;
                await save(this.notes, "notes");
                this.#isSynced = true;
                resolve();
            }, 200);
        });

    }

    async deleteOne(id) {
        return new Promise((resolve) => {
            const timer = setInterval(async () => {
                if (!this.#isSynced) return;
                this.#isSynced = false;
                clearInterval(timer);
                const newNotes = await restore("notes");
                this.notes = newNotes["notes"] ? newNotes["notes"] : this.notes;
                this.notes = this.notes.filter((it) => it !== id);
                remove(id);
                await save(this.notes, "notes");
                this.#isSynced = true;
                resolve();
            }, 200);
        });

    }

    getNotes() {
        return new Promise((resolve) => {
            const timer = setInterval(async () => {
                if (!this.#isSynced) return;
                clearInterval(timer);
                const newNotes = await restore("notes");
                this.notes = newNotes["notes"] ? newNotes["notes"] : this.notes;
                resolve(this.notes);

            });
        });
    }
}

export {NotesManager};