import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import {
  changeFirstLoginPassword,
  dismissFirstLoginPassword,
} from '../../redux/slices/dashboard/dashboard';

const initialForm = { oldPassword: '', password: '', confirmPassword: '' };

const FirstLoginPasswordModal = ({ show, learnerName }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const isLoading = useSelector((state) => state?.dashboard?.firstLoginActionLoading);
  const apiError = useSelector((state) => state?.dashboard?.firstLoginActionError);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [visible, setVisible] = useState({ oldPassword: false, password: false, confirmPassword: false });

  const passwordRules = useMemo(() => ({
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[!@#$%^&*]/.test(form.password),
  }), [form.password]);

  const strength = Object.values(passwordRules).filter(Boolean).length;

  const handleFieldChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFormError('');
  };

  const toggleVisibility = (field) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }));
  };

  const signOut = () => {
    localStorage.removeItem('userLearner');
    localStorage.removeItem('accessTokenLearner');
    localStorage.removeItem('menusLearner');
    dispatch({ type: 'LOGOUT' });
    router.replace('/', '', { shallow: true });
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (!form.oldPassword) return setFormError('Enter the temporary password you used to sign in.');
    if (strength !== 5) return setFormError('Your new password must meet all security requirements.');
    if (form.password !== form.confirmPassword) return setFormError('New password and confirmation do not match.');
    if (form.password === form.oldPassword) return setFormError('Your new password must be different from the temporary password.');

    const result = await dispatch(changeFirstLoginPassword({
      oldPassword: form.oldPassword,
      password: form.password,
    }));

    if (result?.success) {
      setForm(initialForm);
      await Swal.fire({
        icon: 'success',
        title: 'Password updated',
        text: 'Your account is secure. Please sign in again using your new password.',
        confirmButtonText: 'Sign in again',
        confirmButtonColor: '#17a34a',
        allowOutsideClick: false,
      });
      signOut();
    }
  };

  const handleDismiss = async () => {
    const darkTheme = document.body.classList.contains('dark-theme');
    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'Skip password setup?',
      html: 'This setup appears only once. You can still change your password later from <strong>Profile &gt; Change Password</strong>.',
      showCancelButton: true,
      confirmButtonText: 'Skip for now',
      cancelButtonText: 'Continue setup',
      confirmButtonColor: '#17a34a',
      cancelButtonColor: darkTheme ? '#475569' : '#64748b',
      reverseButtons: true,
      background: darkTheme ? '#111a22' : '#ffffff',
      color: darkTheme ? '#e2e8f0' : '#172033',
      allowOutsideClick: false,
    });

    if (!confirmation.isConfirmed) return;
    const result = await dispatch(dismissFirstLoginPassword());
    if (result?.success) {
      setForm(initialForm);
      setFormError('');
      setStep(1);
    }
  };

  const fields = [
    { name: 'oldPassword', label: 'Temporary password', placeholder: 'Enter your current password', autocomplete: 'current-password' },
    { name: 'password', label: 'New password', placeholder: 'Create a new password', autocomplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm new password', placeholder: 'Enter the new password again', autocomplete: 'new-password' },
  ];

  const rules = [
    ['length', '8+ characters'],
    ['uppercase', 'Uppercase'],
    ['lowercase', 'Lowercase'],
    ['number', 'Number'],
    ['special', 'Special character'],
  ];

  return (
    <Modal
      show={show}
      centered
      backdrop='static'
      keyboard={false}
      className='first-login-simple-modal'
      contentClassName='first-login-simple-content'
      aria-labelledby='first-login-title'
    >
      {step === 1 ? (
        <div>
          <div className='first-login-simple-hero'>
            <button type='button' className='first-login-simple-close is-light' onClick={handleDismiss} disabled={isLoading} aria-label='Skip password setup'>
              <i className='ti ti-x'></i>
            </button>
            <span>Welcome to siberSIM</span>
            <h2 id='first-login-title'>Hello, {learnerName || 'Learner'}!</h2>
            <p>Your learning account is ready.</p>
          </div>

          <div className='first-login-simple-body'>
            <div className='first-login-simple-intro'>
              <span><i className='ti ti-key'></i></span>
              <div>
                <h3>Secure your account</h3>
                <p>You signed in with a temporary password. Create a personal password before you continue.</p>
              </div>
            </div>

            <div className='first-login-simple-note'>
              <i className='ti ti-info-circle'></i>
              <span>This is a one-time setup and takes less than a minute.</span>
            </div>

            <div className='first-login-simple-actions'>
              <Button type='button' className='first-login-simple-secondary' onClick={handleDismiss} disabled={isLoading}>Not now</Button>
              <Button type='button' className='first-login-simple-primary' onClick={() => setStep(2)}>
                Continue <i className='ti ti-arrow-right ms-2'></i>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Form onSubmit={handlePasswordChange} noValidate>
          <div className='first-login-simple-header'>
            <button type='button' className='first-login-simple-back' onClick={() => setStep(1)} disabled={isLoading} aria-label='Back to welcome'>
              <i className='ti ti-arrow-left'></i>
            </button>
            <div>
              <span>Step 2 of 2</span>
              <h2>Create your password</h2>
            </div>
            <button type='button' className='first-login-simple-close' onClick={handleDismiss} disabled={isLoading} aria-label='Skip password setup'>
              <i className='ti ti-x'></i>
            </button>
          </div>

          <div className='first-login-simple-form-body'>
            <p className='first-login-simple-helper'>Use your temporary password once, then choose a password only you know.</p>

            {fields.map((field) => (
              <Form.Group className='first-login-simple-field' key={field.name}>
                <Form.Label>{field.label}</Form.Label>
                <div className='first-login-simple-input'>
                  <Form.Control
                    type={visible[field.name] ? 'text' : 'password'}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleFieldChange}
                    placeholder={field.placeholder}
                    autoComplete={field.autocomplete}
                    disabled={isLoading}
                  />
                  <button type='button' onClick={() => toggleVisibility(field.name)} aria-label={`Show or hide ${field.label.toLowerCase()}`}>
                   <i className={visible[field.name] ? 'fa fa-eye-slash' : 'fa fa-eye'}></i>
                  </button>
                </div>
              </Form.Group>
            ))}

            <div className='first-login-simple-strength' aria-live='polite'>
              <div className='first-login-simple-strength-title'>
                <span>Password strength</span>
                <strong className={strength === 5 ? 'is-strong' : ''}>{strength === 5 ? 'Strong' : `${strength}/5 complete`}</strong>
              </div>
              <div className='first-login-simple-bars'>
                {[1, 2, 3, 4, 5].map((level) => <i key={level} className={strength >= level ? 'is-active' : ''}></i>)}
              </div>
              <div className='first-login-simple-rules'>
                {rules.map(([key, label]) => (
                  <span key={key} className={passwordRules[key] ? 'is-valid' : ''}>
                    <i className={passwordRules[key] ? 'ti ti-check' : 'ti ti-point-filled'}></i>{label}
                  </span>
                ))}
              </div>
            </div>

            {(formError || apiError) && (
              <div className='first-login-simple-error' role='alert'>
                <i className='ti ti-alert-circle'></i><span>{formError || apiError}</span>
              </div>
            )}

            <div className='first-login-simple-actions is-form'>
              <Button type='button' className='first-login-simple-secondary' onClick={handleDismiss} disabled={isLoading}>Skip</Button>
              <Button type='submit' className='first-login-simple-primary' disabled={isLoading}>
                {isLoading ? <><Spinner size='sm' className='me-2' />Updating...</> : 'Change password'}
              </Button>
            </div>
          </div>
        </Form>
      )}
    </Modal>
  );
};

FirstLoginPasswordModal.propTypes = {
  show: PropTypes.bool,
  learnerName: PropTypes.string,
};

export default FirstLoginPasswordModal;
