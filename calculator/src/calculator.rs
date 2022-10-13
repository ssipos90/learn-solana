use borsh::{BorshDeserialize, BorshSerialize};

#[derive(BorshDeserialize, BorshSerialize)]
pub struct Calculator {
    pub value: i32,
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub enum CalculatorOperation {
    Add,
    Subtract,
    Multiply,
    Nullify,
}

#[derive(BorshDeserialize, BorshSerialize, Debug)]
pub struct CalculatorInstruction {
    operation: CalculatorOperation,
    value: i32,
}

impl CalculatorInstruction {
    pub fn evaluate(&self, value: i32) -> i32 {
        match self.operation {
            CalculatorOperation::Add => value + self.value,
            CalculatorOperation::Subtract => value - self.value,
            CalculatorOperation::Multiply => value * self.value,
            CalculatorOperation::Nullify => 0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{CalculatorInstruction, CalculatorOperation};

    #[test]
    fn adding_1() {
        let ci = CalculatorInstruction {
            value: 1,
            operation: CalculatorOperation::Add,
        };
        assert_eq!(1, ci.evaluate(0));
    }

    #[test]
    fn subbing_1() {
        let ci = CalculatorInstruction {
            value: 1,
            operation: CalculatorOperation::Subtract,
        };
        assert_eq!(-1, ci.evaluate(0));
    }

    #[test]
    fn mulling_times_2() {
        let ci = CalculatorInstruction {
            value: 2,
            operation: CalculatorOperation::Multiply,
        };
        assert_eq!(10, ci.evaluate(5));
    }

    #[test]
    fn resetting() {
        let ci = CalculatorInstruction {
            value: 5,
            operation: CalculatorOperation::Nullify,
        };
        assert_eq!(0, ci.evaluate(10));
    }
}
