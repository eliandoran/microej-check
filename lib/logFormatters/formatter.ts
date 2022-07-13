import Log from "../log";

export default interface Formatter {

    format(log: Log): void;
    beforeExit(): void;

}