use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshDeserialize,BorshSerialize)]
pub struct Calculator {
    pub value: u32,
}

#[derive(BorshDeserialize,BorshSerialize, Debug)]
pub enum CalculatorOperation {
    Add,
    Subtract,
    Multiply,
    Nullify,
}

#[derive(BorshDeserialize,BorshSerialize, Debug)]
pub struct CalculatorInstruction {
    operation: CalculatorOperation,
    value: u32,
}

impl CalculatorInstruction {
    pub fn evaluate(&self, value: u32) -> u32 {
        match self.operation {
            CalculatorOperation::Add => value + self.value,
            CalculatorOperation::Subtract => value - self.value,
            CalculatorOperation::Multiply => value * self.value,
            CalculatorOperation::Nullify => 0,
        }
    }
}
