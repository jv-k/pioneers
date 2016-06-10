/// <reference path='year.ts'/>
/// <reference path='person.ts'/>

namespace Timeline {
    export class Timeline implements Structure.Tab {
        private people: Array<Timeline.Person>;
        private years: Array<Timeline.Year>;
        private columnSize: number;

        public static PADDING: [number, number] = [80, 20];

        constructor(public svg: Snap.Paper) {
            this.columnSize = 100;
            this.years = [];
            this.people = [];
            this.reset();
        }

        public build(set: Array<Structure.Person>): boolean {
            this.reset();

            let years = this.buildPeople(set);
            this.years = Object.keys(years)
                               .map((k: string) => years[parseInt(k)])
                               .sort((a, b) => a.year - b.year);

            // Set Y-axis position for each achievement based on where 'a.year' sits in sorted array of years.
            // This is not good. But it's not O(n^3) despite the nested loops.
            return this.forAchievements((a, p) => {
                for (let i = 0; i < this.years.length; i++) {
                    if (this.years[i].year == a.details.year) {
                        a.column = i;
                        return true;
                    }
                }

                return false;
            }, true);
        }

        public execute(): void {
            this.drawScale();
            this.forAchievements((a, p) => a.draw(this.columnSize, p.details, this.svg));
            this.position();
        }

        private position(iteration = 1): void {
            this.forAchievements((a, p) => a.position());

            // Approximation of iterations that's visually effective.
            if (iteration < (5.5 / Achievement.ATTRACTION_SPEED)) {
                requestAnimationFrame(() => this.position(iteration + 1));
            } else {
                this.forAchievements((a, p) => a.snap());
            }
        }

        public unfocus(): void {
            this.svg.clear();
        }

        public resize(): void {
            let [width, height] = [$(window).width(), $(window).height() - $("#datacanvas").offset().top];
            
            this.columnSize = (width - (Timeline.PADDING[1] * 2)) / this.years.length;
            this.svg.attr({width: width, height: height});
        }

        public built(): boolean {
            return this.people.length > 0;
        }

        private forAchievements(f: (a: Achievement, p: Person) => void, ensureTrue = false): boolean {
            for (let p of this.people) {
                for (let a of p.achievements) {
                    if (!f(a, p) && ensureTrue) {
                        return false;
                    }
                }
            }

            return true;
        }

        private reset(): void {
            this.years = [];
            this.people = [];
        }

        private buildPeople(set: Array<Structure.Person>): {[K: number]: Timeline.Year} {
            // Temporarily store as a map to allow for faster lookups.
            let years: {[K: number]: Timeline.Year} = {};

            for (let p of set) {
                let person = new Person(p);

                for (let a of p.achievements) {
                    let achievement = new Achievement(a);

                    achievement.row = this.rowFor(years, a.year);
                    person.achievements.push(achievement);
                }

                this.people.push(person);
            }

            return years;
        }

        private rowFor(years: {[K: number]: Timeline.Year}, year: number): number {
            if (years[year] == undefined) {
                years[year] = new Year(year);
            } else {
                years[year].inc();
            }

            return years[year].count;
        }

        private drawScale() {
            let width = parseInt(this.svg.attr("width"));
            let padding = Timeline.PADDING[1];
            let scale = this.svg.line(padding, 20, width - padding, 20);
            let pointer = this.svg.path("M0,23l20,0l-10,10l-10,-10Z");
            let year = this.svg.text(0, 16, this.years[0].year);
            let g = this.svg.group(pointer, year);

            year.attr({fill:"#ffffff", fontSize: "0.8em", fontFamily: "sans-serif, arial"});
            pointer.attr({fill:"#ffffff"});
            scale.attr({stroke: "#ffffff"});
            g.transform(`translate(${padding},0)`);

            this.svg.mousemove((e:MouseEvent) => {
              let x = Math.max(Math.min(e.clientX, width - (padding * 1.5)), (padding * 1.5)) - (padding / 2);
              let i = Math.floor((e.clientX - padding) / this.columnSize);

              if (i >= 0 && i < this.years.length) {
                  year.attr({text: this.years[i].year});
                  g.transform(`translate(${x},0)`);
              }
            });
        }
    }
}