import { serialize } from "borsh";
import { u32, u8, struct, Structure } from '@solana/buffer-layout';

class Calculator {
  value = 0;
  constructor(fields?: { value: number }) {
    if (fields) {
      this.value = fields.value;
    }
  }
}

const CalculatorSchema = new Map([
  [Calculator, { kind: 'struct', fields: [['value', 'u32']] }]
]);

export const calculator = { size: serialize(CalculatorSchema, new Calculator()).length }

/***********************************************/

export enum CalculatorInstructionOperation {
  Add = 0,
  Divide,
  Multiply,
  Nullify,
}

interface CalculatorInstruction {
  value: number;
  operation: CalculatorInstructionOperation;
}

export const calculatorInstructionLayout: Structure<CalculatorInstruction> = struct([
  u8('operation'),
  u32('value'),
]);
