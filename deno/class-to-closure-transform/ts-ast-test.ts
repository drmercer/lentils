const yeet = 'hi';

const yeet2 = 'bye';

// test comment

@Injectable()
export default class Foo {
  constructor(
    public bagel: Bagel,
    private potato: Potato,
  ) {
    this.bagel = 'foo';
  }

  /**
   * Candy bar
   */
  private bar = 'hello';

  /**
   * Some yeets
   */
  public yeet() {
    console.log("hello", this.bar);

    // foo

    console.log("hello", this.bar);
  }

  public bar2 = 'hello';
}

const yeet3 = 'hi';
