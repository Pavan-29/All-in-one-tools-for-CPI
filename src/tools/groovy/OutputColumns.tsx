import Panel from '../../components/common/Panel';
import CodeArea from '../../components/common/CodeArea';
import CopyButton from '../../components/common/CopyButton';
import KeyValueEditor from './KeyValueEditor';
import type { CpiMessageState } from '../../utils/cpiMessage';

export default function OutputColumns({
  state,
}: {
  state: CpiMessageState | null;
}) {
  const body =
    state?.body == null
      ? ''
      : typeof state.body === 'string'
        ? state.body
        : JSON.stringify(state.body, null, 2);

  return (
    <div className="space-y-3">
      <Panel title="Output · Body" actions={<CopyButton value={body} />}>
        <CodeArea
          value={body}
          readOnly
          placeholder="Script output payload will appear here..."
          className="h-56"
        />
      </Panel>
      <Panel title="Headers">
        <KeyValueEditor
          pairs={Object.entries(state?.headers ?? {}).map(([key, value]) => ({
            key,
            value,
          }))}
          onChange={() => {}}
          readOnly
        />
      </Panel>
      <Panel title="Properties">
        <KeyValueEditor
          pairs={Object.entries(state?.properties ?? {}).map(([key, value]) => ({
            key,
            value,
          }))}
          onChange={() => {}}
          readOnly
        />
      </Panel>
      <Panel title="Message Processing Logs">
        <div className="space-y-3">
          <div>
            <div className="text-[11px] font-semibold mb-1 text-slate-500 dark:text-slate-400">
              Log Properties
            </div>
            <KeyValueEditor
              pairs={(state?.logProperties ?? []).map((l) => ({
                key: l.name,
                value: l.value,
              }))}
              onChange={() => {}}
              readOnly
            />
          </div>
          <div>
            <div className="text-[11px] font-semibold mb-1 text-slate-500 dark:text-slate-400">
              Custom Header Properties
            </div>
            <KeyValueEditor
              pairs={Object.entries(
                state?.customHeaderProperties ?? {}
              ).map(([key, value]) => ({ key, value }))}
              onChange={() => {}}
              readOnly
            />
          </div>
          <div>
            <div className="text-[11px] font-semibold mb-1 text-slate-500 dark:text-slate-400">
              Attachments
            </div>
            <KeyValueEditor
              pairs={(state?.attachments ?? []).map((a) => ({
                key: a.name,
                value:
                  a.value.length > 60
                    ? a.value.slice(0, 60) + '…'
                    : a.value,
              }))}
              onChange={() => {}}
              readOnly
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}
