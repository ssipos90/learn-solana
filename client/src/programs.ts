import { serialize } from 'borsh';

interface ProgramStuff {
  size: number;
}

/*************************/

class MathStuffSum {
  sum = 0;
  constructor(fields?: { sum: number }) {
    if (fields) {
      this.sum = fields.sum;
    }
  }
}

const MathStuffSumSchema = new Map([
  [MathStuffSum, { kind: 'struct', fields: [['sum', 'u32']] }]
]);

/*************************/

class MathStuffSquare {
  sum = 0;
  constructor(fields?: { sum: number }) {
    if (fields) {
      this.sum = fields.sum;
    }
  }
}

const MathStuffSquareSchema = new Map([
  [MathStuffSquare, { kind: 'struct', fields: [['sum', 'u32']] }]
]);

/*************************/
export const programs = new Map<string, ProgramStuff>([
  ['sum', { size: serialize(MathStuffSumSchema, new MathStuffSum()).length }],
  ['square', { size: serialize(MathStuffSquareSchema, new MathStuffSquare()).length }],
]);
