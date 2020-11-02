import React from 'react';
import Button from '../common/Button';
import { toggleShowSave } from '../stores/editor-actions';
import {
  useSessionQueryName,
  useSessionQueryShared,
  useSessionUnsavedChanges,
} from '../stores/editor-store';
import SharedIcon from 'mdi-react/AccountMultipleIcon';
import Tooltip from '../common/Tooltip';

// Shared icon is nudged a bit to align bottom of icon to text baseline
const sharedIconStyle = {
  marginLeft: 8,
  marginTop: 4,
};

function ToolbarQueryName() {
  const queryName = useSessionQueryName();
  const shared = useSessionQueryShared();
  const unsavedChanges = useSessionUnsavedChanges();

  // Even though tooltip is on Button it is needed to be wrapped
  // Might have something to do with fragment use
  return (
    <Tooltip
      label={`${unsavedChanges ? 'Unsaved changes. ' : ''}Edit and save query`}
    >
      <Button
        className="truncate"
        variant="primary-ghost"
        style={{ fontSize: 18 }}
        onClick={toggleShowSave}
      >
        <div className="truncate" style={{ maxWidth: 500 }}>
          {queryName || 'New unsaved query'}
        </div>
        {unsavedChanges && '*'}
        {shared && <SharedIcon size={18} style={sharedIconStyle} />}
      </Button>
    </Tooltip>
  );
}

export default React.memo(ToolbarQueryName);
