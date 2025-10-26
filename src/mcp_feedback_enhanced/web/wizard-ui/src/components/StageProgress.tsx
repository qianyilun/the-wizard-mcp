/**
 * Stage progress indicator showing workflow stages
 */
import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Psychology as PsychologyIcon,
  AccountTree as AccountTreeIcon,
  Science as ScienceIcon,
  Code as CodeIcon,
  RateReview as RateReviewIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useWizardStore } from '../store/wizardStore';
import type { WizardStage, UIStage } from '../types';

// Stage mapping from backend to UI stages
const stageMapping: Record<WizardStage, UIStage> = {
  COLLECT_CONTEXT: 'context',
  INSIGHT_CLASSIFICATION: 'mode',
  REVIEW_BLUEPRINT: 'plan',
  GENERATE_BLUEPRINT: 'plan',
  REVIEW_TEST_MATRIX: 'tests',
  GENERATE_TEST_MATRIX: 'tests',
  GENERATE_IMPLEMENTATION: 'code',
  REVIEW_TRACE: 'review',
  WORKFLOW_COMPLETE: 'review',
};

// UI stage configuration
const stageConfig = [
  { id: 'context' as UIStage, label: 'Context', icon: DescriptionIcon },
  { id: 'mode' as UIStage, label: 'Mode', icon: PsychologyIcon },
  { id: 'plan' as UIStage, label: 'Blueprint', icon: AccountTreeIcon },
  { id: 'tests' as UIStage, label: 'Tests', icon: ScienceIcon },
  { id: 'code' as UIStage, label: 'Code', icon: CodeIcon },
  { id: 'review' as UIStage, label: 'Review', icon: RateReviewIcon },
];

// Custom connector styling
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.success.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.grey[300],
    borderRadius: 1,
  },
}));

// Custom step icon styling
const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.grey[300],
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundColor: theme.palette.primary.main,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundColor: theme.palette.success.main,
  }),
}));

interface ColorlibStepIconProps {
  active?: boolean;
  completed?: boolean;
  className?: string;
  icon: React.ReactNode;
}

const ColorlibStepIcon: React.FC<ColorlibStepIconProps> = ({
  active = false,
  completed = false,
  className = '',
  icon,
}) => {
  const IconComponent = stageConfig[Number(icon) - 1]?.icon || DescriptionIcon;

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <CheckCircleIcon /> : <IconComponent />}
    </ColorlibStepIconRoot>
  );
};

export const StageProgress: React.FC = () => {
  const { currentStage, completedStages } = useWizardStore();

  // Convert backend stages to UI stages
  const currentUIStage = stageMapping[currentStage];
  const completedUIStages = completedStages.map(stage => stageMapping[stage]);

  // Determine active step index
  const activeStep = stageConfig.findIndex(stage => stage.id === currentUIStage);

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Stepper
        alternativeLabel
        activeStep={activeStep}
        connector={<ColorlibConnector />}
      >
        {stageConfig.map((stage, index) => {
          const isCompleted = completedUIStages.includes(stage.id);

          return (
            <Step key={stage.id} completed={isCompleted}>
              <StepLabel
                StepIconComponent={(props) => (
                  <ColorlibStepIcon {...props} icon={index + 1} />
                )}
              >
                {stage.label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};
