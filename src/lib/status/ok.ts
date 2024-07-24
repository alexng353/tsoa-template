type NonVoidNonPromise<T> = T extends void | Promise<unknown> ? never : T;

export class Ok<T = null> {
  constructor(public data?: NonVoidNonPromise<T>) {}
  toJSON() {
    return { success: true, status: 200, data: this.data ?? null };
  }
}
