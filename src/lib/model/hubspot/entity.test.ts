import { Entity } from './entity.js';

type PersonProps = {
  age: number;
  name: string;
};

class Person extends Entity<PersonProps> {
  pseudoProperties = [];
}

describe('entities', () => {

  it('has dynamic data', () => {
    const p = new Person('123', 'contact', {
      age: 20,
      name: 'Bob',
    }, {
      addIndexesFor() { },
      removeIndexesFor() { },
    });
    expect(p.hasPropertyChanges()).toBe(false);
    expect(p.data.age).toEqual(20);
    expect(p.data.name).toEqual('Bob');

    p.data.age++;
    expect(p.hasPropertyChanges()).toBe(true);
    expect(p.data.age).toEqual(21);
    expect(p.data.name).toEqual('Bob');

    p.data.name += 'by';
    expect(p.hasPropertyChanges()).toBe(true);
    expect(p.data.age).toEqual(21);
    expect(p.data.name).toEqual('Bobby');

    p.applyPropertyChanges();
    expect(p.hasPropertyChanges()).toBe(false);
    expect(p.data.age).toEqual(21);
    expect(p.data.name).toEqual('Bobby');
  });

});
