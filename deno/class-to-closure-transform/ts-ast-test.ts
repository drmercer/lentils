const yeet = 'hi';

const yeet2 = 'bye';

// test comment

@Injectable()
export default class Foo {
  constructor(
    public bagel: Bagel,
    private potato: Potato,
  ) {}

  private bar = 'hello';

  public yeet() {
    console.log("hello", this.bar);
  }

  public bar2 = 'hello';
}

const yeet3 = 'hi';
