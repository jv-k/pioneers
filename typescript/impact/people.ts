/// <reference path='../structure/resolution.ts'/>

namespace Impact {
    export class People extends Array<Person> {
        private total: number;
        private center: Vector;
        public alive: boolean;
        public resolution: Structure.Resolution;

        private static MIN_REFINEMENT = 50;
        private static MAX_DELTA = 0.7;
        private static DAMPING_FACTOR = 0.25;
        private static REFINEMENT_DELTA = 4;
        private static REDRAW_THRESHOLD = 35;
        private static SIZING_DELTA = 0.057;

        constructor() {
            super();

            this.resolution = "High";
            this.total = 0;
            this.alive = true;
        }

        public centerize(width: number, height: number): void {
            this.center = new Vector(width / 2.0, height / 2.0);
        }

        public push(p: Person): number {
            this.total += p.details.impact;
            return super.push(p);
        }

        public pack(): void {
            let [w, h] = [this.center.x * 2, this.center.y * 2]
            let unit = Math.min(w / this.total, h / this.total) * this.delta();

            this.alive = true;

            for (let p of this) {
                p.draw(unit);
            }

            this.position();
        }

        public reset(): void {
            this.alive = false;

            for (let p of this) {
                p.reset();
            }
        }

        public clear(): void {
            this.alive = false;
            this.total = 0;
            this.length = 0;
        }

        private position(iteration = 1): void {
            let redraw = false;
            let iterations = Math.max(People.MIN_REFINEMENT, this.length * People.REFINEMENT_DELTA);

            if (this.resolution == "High") {
                redraw = iteration % Math.ceil(this.length / People.REDRAW_THRESHOLD) == 0;
            } else {
                redraw = iteration == iterations;
            }

            // Sort from closest->furthest to center point.
            this.sort((a: Person, b: Person) => {
                let c = this.center;
                return a.point.distanceFrom(c) - b.point.distanceFrom(c);
            });

            // Detract other particles.
            for (let i=0;i<this.length;i++) {
                for (let n=i+1;n<this.length;n++) {
                    this[i].detract(this[n], 12);
                }
            }

            // Attract to center point.
            for (let p of this) {
                p.attract(this.center, People.DAMPING_FACTOR / iteration);

                if (redraw) {
                    p.position();
                }
            }

            // Refine.
            if (this.alive && iteration < iterations) {
                Helpers.onHighRes(this.resolution, () => this.position(iteration + 1));
            }
        }

        private delta(): number {
            return (this.length == 1) ? People.MAX_DELTA : 1 + ((this.length - 1) * People.SIZING_DELTA);
        }
    }
}
