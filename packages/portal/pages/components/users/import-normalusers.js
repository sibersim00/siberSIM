import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import {
  clearHasError,
  clearImportNormaluser,
  clearVerifyImportNormaluser,
  getNormalusersManageList,
  saveImportNormaluser,
  verifyImportNormaluser,
} from '../../../shared/redux/slices/normalusers/normalUserManage';

const aliases = {
  firstname: ['firstname', 'first name', 'first_name'],
  lastname: ['lastname', 'last name', 'last_name'],
  email: ['email', 'email address', 'email id'],
  mobile: ['mobile', 'phone number', 'mobile number'],
  username: ['username', 'user name', 'login id', 'loginid'],
  status: ['status'],
};

const normalizeHeader = (value) => String(value || '').trim().toLowerCase();
const pick = (row, field) => {
  const key = Object.keys(row).find((item) => aliases[field].includes(normalizeHeader(item)));
  return key ? row[key] : '';
};

const ImportNormalUsers = ({ show, onHide }) => {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [fileError, setFileError] = useState('');
  const [filter, setFilter] = useState('all');
  const [processing, setProcessing] = useState('');
  const { loading, verification, imported, apiError } = useSelector((state) => ({
    loading: state.normalUSerData?.isLoading,
    verification: state.normalUSerData?.verifyImportNormaluserResp,
    imported: state.normalUSerData?.saveImportNormaluserResp,
    apiError: state.normalUSerData?.error,
  }));

  const verified = verification?.data;
  const displayedRows = useMemo(() => {
    if (!verified) return rows;
    if (filter === 'valid') return verified.success || [];
    if (filter === 'error') return verified.errors || [];
    return [...(verified.success || []), ...(verified.errors || [])].sort((a, b) => a.rowNumber - b.rowNumber);
  }, [filter, rows, verified]);

  const processingItems = processing === 'import'
    ? ['Generating FirstName@Username passwords', 'Hashing passwords securely', 'Saving learner accounts', 'Preparing welcome emails']
    : ['First Name', 'Last Name', 'Username', 'Email Address', 'Mobile Number'];

  const reset = () => {
    setFile(null);
    setRows([]);
    setFileError('');
    setFilter('all');
    setProcessing('');
    dispatch(clearVerifyImportNormaluser());
    dispatch(clearImportNormaluser());
    dispatch(clearHasError());
    if (inputRef.current) inputRef.current.value = '';
  };

  useEffect(() => {
    if (imported?.statusCode === 200) {
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
          {imported.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: false,
          theme: "colored",
        },
      );
      dispatch(getNormalusersManageList());
      reset();
      onHide();
    }
  }, [imported]);

  useEffect(() => {
    if (verified || apiError) setProcessing('');
  }, [verified, apiError]);

  const readFile = async (selectedFile) => {
    reset();
    if (!selectedFile) return;
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (!['xls', 'xlsx', 'csv'].includes(extension)) {
      setFileError('Choose a valid XLS, XLSX, or CSV file.');
      return;
    }
    try {
      const workbook = XLSX.read(await selectedFile.arrayBuffer(), { type: 'array' });
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
      const parsed = rawRows.map((row, index) => ({
        rowNumber: index + 2,
        firstname: pick(row, 'firstname'),
        lastname: pick(row, 'lastname'),
        email: pick(row, 'email'),
        mobile: pick(row, 'mobile'),
        username: pick(row, 'username'),
        status: pick(row, 'status') || 'Active',
      }));
      if (!parsed.length) {
        setFileError('The selected file has no learner records.');
        return;
      }
      setFile(selectedFile);
      setRows(parsed);
    } catch (error) {
      setFileError('This spreadsheet could not be read. Check the file and try again.');
    }
  };

  const verify = () => {
    if (!rows.length) return setFileError('Select a spreadsheet before verifying.');
    setProcessing('verify');
    dispatch(verifyImportNormaluser(rows));
  };

  const importValid = () => {
    if (verified?.success?.length) {
      setProcessing('import');
      dispatch(saveImportNormaluser(verified.success.map(({ issues, ...row }) => row)));
    }
  };

  const exportErrors = () => {
    const data = (verified?.errors || []).map((row) => ({
      'Excel Row': row.rowNumber,
      'First Name': row.firstname,
      'Last Name': row.lastname,
      Email: row.email,
      Mobile: row.mobile,
      Username: row.username,
      Errors: (row.issues || []).map((issue) => issue.message).join(' | '),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), 'Import Errors');
    XLSX.writeFile(workbook, `SIMUser_Import_Errors_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const close = () => {
    reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={close} backdrop='static' centered size='xl' className='learner-import-modal'>
      <Modal.Header className='learner-import-header'>
        <div className='d-flex align-items-center gap-3'>
          <span className='learner-import-icon'><i className='fe fe-users' /></span>
          <div>
            <span className='learner-import-eyebrow'>Bulk account setup</span>
            <Modal.Title>Import SIMUsers</Modal.Title>
            <p className='mb-0'>Upload, review, and create learner accounts in three simple steps.</p>
          </div>
        </div>
        <button type='button' className='btn-close' aria-label='Close' onClick={close} />
      </Modal.Header>

      <Modal.Body className='p-4'>
        {processing ? (
          <div className='learner-import-processing'>
            <div className='learner-import-processing-orbit'>
              <Spinner animation='border' role='status' />
              <i className={processing === 'import' ? 'fe fe-user-plus' : 'fe fe-search'} />
            </div>
            <span className='learner-import-processing-step'>{processing === 'import' ? 'Step 3 of 3' : 'Step 2 of 3'}</span>
            <h4>{processing === 'import' ? 'Creating learner accounts' : 'Checking your spreadsheet'}</h4>
            <p>{processing === 'import' ? 'Please keep this window open while the valid learners are imported.' : `Validating ${rows.length} row${rows.length === 1 ? '' : 's'} and checking existing learner records.`}</p>
            <div className='learner-import-check-grid'>
              {processingItems.map((item, index) => (
                <span key={item} style={{ animationDelay: `${index * 0.12}s` }}>
                  <i className='fe fe-check-circle' />{item}
                </span>
              ))}
            </div>
            <div className='learner-import-progress-track'><span /></div>
            <small>{processing === 'import' ? 'Passwords are stored as secure bcrypt hashes.' : 'Checking required values, formatting, and duplicates.'}</small>
          </div>
        ) : !verified && (
          <div className='learner-import-dropzone'>
            <div className='learner-import-step'>Step 1 of 3</div>
            <span className='learner-import-upload'><i className='fe fe-upload-cloud' /></span>
            <h4>Upload your learner spreadsheet</h4>
            <p className='learner-import-help'>Use the sample template for the quickest import. We will validate every row before creating any accounts.</p>
            <div className='learner-import-password-note'>
              <i className='fe fe-lock' />
              <span><strong>No password column is required.</strong> Passwords use the exact spreadsheet casing: <code>FirstName@Username</code>.</span>
            </div>
            <input
              ref={inputRef}
              id='learner-import-file'
              type='file'
              accept='.xls,.xlsx,.csv'
              onChange={(event) => readFile(event.target.files?.[0])}
              className='learner-import-native-input'
            />
            <label htmlFor='learner-import-file' className='learner-import-picker'>
              <i className='fe fe-folder me-2' />Choose spreadsheet
            </label>
            <div className='learner-import-formats'><span>XLSX</span><span>XLS</span><span>CSV</span><small>Up to 1,000 rows</small></div>
            {file && <div className='learner-import-selected'><i className='fe fe-file-text' /> {file.name} <Badge bg='light' text='dark'>{rows.length} rows</Badge></div>}
            {fileError && <div className='text-danger mt-2'>{fileError}</div>}
          </div>
        )}

        {apiError?.message && <Alert variant='danger' className='mt-3 mb-0'>{apiError.message}</Alert>}

        {!processing && verified && (
          <>
            <div className='learner-import-summary'>
              <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
                <span>{verified.total || 0}</span><small>All rows</small>
              </button>
              <button className={filter === 'valid' ? 'active success' : 'success'} onClick={() => setFilter('valid')}>
                <span>{verified.success?.length || 0}</span><small>Ready</small>
              </button>
              <button className={filter === 'error' ? 'active danger' : 'danger'} onClick={() => setFilter('error')}>
                <span>{verified.errors?.length || 0}</span><small>Need attention</small>
              </button>
              {!!verified.errors?.length && (
                <Button variant='outline-danger' className='ms-auto' onClick={exportErrors}>
                  <i className='fe fe-download me-2' />Export errors
                </Button>
              )}
            </div>

            <div className='learner-import-table-wrap'>
              <table className='table learner-import-table mb-0'>
                <thead><tr><th>Row</th><th>Name</th><th>Email</th><th>Mobile</th><th>Username</th><th>Result</th></tr></thead>
                <tbody>
                  {displayedRows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.email}`}>
                      <td>{row.rowNumber}</td>
                      <td>{`${row.firstname || ''} ${row.lastname || ''}`.trim() || '—'}</td>
                      <td>{row.email || '—'}</td>
                      <td>{row.mobile || '—'}</td>
                      <td>{row.username || '—'}</td>
                      <td>
                        {row.issues?.length ? (
                          <div className='learner-import-issues'>{row.issues.map((issue, index) => <span key={`${issue.field}-${index}`}>{issue.message}</span>)}</div>
                        ) : <span className='learner-import-ready'><i className='fe fe-check-circle' /> Ready to import</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className='learner-import-footer'>
        <a href={`${process.env.BASE_PATH}assets/docs/learners-import.xlsx`} download className='btn btn-link me-auto'>
          <i className='fe fe-download me-2' />Download sample
        </a>
        <Button variant='outline-secondary' disabled={!!processing} onClick={verified ? reset : close}>{verified ? 'Start over' : 'Cancel'}</Button>
        {!verified ? (
          <Button onClick={verify} disabled={!rows.length || loading || !!processing}>
            {(loading || processing === 'verify') && <Spinner size='sm' className='me-2' />}
            {processing === 'verify' ? 'Verifying learner data...' : 'Verify file'}
          </Button>
        ) : (
          <Button onClick={importValid} disabled={!verified.success?.length || loading || !!processing}>
            {(loading || processing === 'import') && <Spinner size='sm' className='me-2' />}
            {processing === 'import' ? 'Importing learner accounts...' : `Import ${verified.success?.length || 0} valid rows`}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ImportNormalUsers;
