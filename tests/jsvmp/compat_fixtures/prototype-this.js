function Person(name) {
  this.name = name;
}

Person.prototype.say = function say() {
  return 'hi ' + this.name;
};

const p = new Person('jsvmp');
console.log(p.say());
