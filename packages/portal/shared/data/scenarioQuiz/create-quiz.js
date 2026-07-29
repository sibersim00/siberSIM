import React, { useEffect, useState } from 'react'
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import * as yup from "yup";
import { Modal, Button, Row, Col, Form, Spinner } from "react-bootstrap";
import Select from "react-select";
import { toast } from "react-toastify";
import { getScenarioQuizlist, saveScenarioQuiz, clearsaveScenarioQuiz, clearHasError } from '../../redux/slices/scenarioquiz/quizManage';
import {
	emojiRegex,
} from "../../utils/regex";
import { useTranslation } from "react-i18next";


const customStyles = {
	control: (styles, { isFocused, isDisabled }) => ({
		...styles,
		borderColor: isDisabled ? "#e8e8f7" : isFocused ? "#00d683" : "#e8e8f7",
		boxShadow: isDisabled ? null : isFocused ? "0 0 0 0.001rem #00d683" : null,
		"&:hover": {
			borderColor: isDisabled
				? "#e8e8f7"
				: isFocused
					? "#00d683"
					: styles.borderColor,
		},
	}),
};

const CreateQuestions = (props) => {
	const { push, query } = useRouter();
	const [querySlug, setQuerySlug] = useState("");
	const { t } = useTranslation();

	const { saveQuestionResp, errorData } = useSelector((state) => ({
		saveQuestionResp: state?.quizManage?.saveQuizData,
		errorData: state?.quizManage?.error,
	}));



	const {
		openModal,
		handleModal,
		rowValues,
		scenarioid,
	} = props;

	const dispatch = useDispatch();
	const questionType = [{ value: "MCQ", label: "MCQ" }, { value: "SCQ", label: "SCQ" }]
	const [initialAnswers, setinitialAnswers] = useState([]);
	const [isLoading, setIsLoading] = useState(false);



	useEffect(() => {
		if (rowValues) {
			const initialAnswers1 = rowValues?.answers?.map(answer => ({
				ans_text: answer.answer_text,
				is_correct: answer.is_correct === "Yes"
					? { value: "Yes", label: "Y" }
					: { value: "No", label: "N" },
				scenarioquestionanswerid: answer.scenarioquestionanswerid,
			})) || [];
			setinitialAnswers(initialAnswers1);
		}
	}, [rowValues])

	useEffect(() => {
		if (query.slug && query.slug.length > 0) {
			setQuerySlug(query.slug[0]);
			dispatch(getScenarioQuizlist(query.slug[0]));
		}
	}, [query.slug]);

	const noEmojiTest = (value) => {
		if (typeof value !== "string") return true;
		return !emojiRegex.test(value);
	};
	const questionForm = useFormik({
		enableReinitialize: true,
		initialValues: {
			scenarioquestionid: rowValues?.scenarioquestionid || 0,
			question_text: rowValues?.question_text || "",
			question_type: rowValues?.question_type
				? questionType.find((obj) => obj.value === rowValues?.question_type)
				: "",
			answers:
				rowValues?.answers?.length > 0
					? [...initialAnswers, ...Array(6).fill({ ans_text: "", is_correct: { value: "No", label: "N" } })].slice(0, 6)
					: Array(6).fill({ ans_text: "", is_correct: { value: "No", label: "N" }, scenarioquestionanswerid: 0 }),
		},
		validationSchema: yup.object().shape({
			question_text: yup
				.string()
				.transform((value) => (typeof value === "string" ? value.trim() : value))
				.required("Question text is required")
				.test(
					"not-empty-or-just-spaces",
					"Question text cannot be empty or just spaces",
					(value) => value && value.trim().length > 0
				)
				.test(
					"no-emoji",
					"Emojis are not allowed",
					(value) => value && !/\p{Extended_Pictographic}/u.test(value)
				),

			question_type: yup
				.object()
				.required("Question type is required"),
			
			answers: yup
				.array()
				.of(
					yup.object().shape({
						ans_text: yup
							.string()
							.transform((value) => (value ? value.trim() : ""))
							.nullable()
							.test("no-emoji-if-present", "Emojis are not allowed", function (value, ctx) {
								const index = parseInt(ctx.path.match(/\[(\d+)\]/)?.[1] ?? -1);
								// For optional answers (3–6), only run emoji check if value is present
								if (index > 1 && value && emojiRegex.test(value)) {
									return this.createError({ message: "Emojis are not allowed" });
								}
								return true;
							}),
						is_correct: yup.object().nullable(),
					})
				)
				.test("first-two-validation", null, function (answers) {
					const { createError, path } = this;

					const errors = [];

					[0, 1].forEach((i) => {
						const answer = answers?.[i];
						const text = answer?.ans_text?.trim() ?? "";
						const hasEmoji = emojiRegex.test(text);

						if (!text) {
							errors.push(
								createError({
									path: `${path}[${i}].ans_text`,
									message: `Answer ${i + 1} is required`,
								})
							);
						} else if (hasEmoji || text === "") {
							errors.push(
								createError({
									path: `${path}[${i}].ans_text`,
									message: `Answer ${i + 1} must not be blank or contain emojis`,
								})
							);
						}

						if (!answer?.is_correct) {
							errors.push(
								createError({
									path: `${path}[${i}].is_correct`,
									message: `Please select correct option for Answer ${i + 1}`,
								})
							);
						}
					});

					if (errors.length > 0) throw new yup.ValidationError(errors);
					return true;
				})


		}),
		onSubmit: async (data) => {
			// setIsLoading(true);

			const correctAnswersCount = data.answers.filter(
				(answer) => answer.is_correct.value === "Yes"
			).length;

			if (data.question_type.value === "MCQ" && correctAnswersCount < 1) {
				toast.error(
					<p className="mx-2 tx-16 d-flex align-items-center mb-0">
						At least one correct answer is required for MCQ
					</p>,
					{
						position: toast.POSITION.TOP_RIGHT,
						hideProgressBar: true,
						theme: "colored",
					}
				);
				return;
			}

			if (data.question_type.value === "SCQ" && correctAnswersCount !== 1) {
				toast.error(
					<p className="mx-2 tx-16 d-flex align-items-center mb-0">
						Exactly one correct answer is required for SCQ
					</p>,
					{
						position: toast.POSITION.TOP_RIGHT,
						hideProgressBar: true,
						theme: "colored",
					}
				);

				return;
			}

			try {
				setIsLoading(true);
				const answerArray = data.answers
					.filter((obj) => obj.ans_text?.trim())
					.map((obj) => ({
						answer_text: obj.ans_text,
						is_correct: obj.is_correct.value,
						scenarioquestionanswerid: obj.scenarioquestionanswerid || 0,
					}));

				const payload = {
					scenarioid: scenarioid,
					scenarioquestionid: data.scenarioquestionid || 0,
					question_text: data.question_text,
					question_type: data.question_type.value,
					answersArray: answerArray,
				};

				dispatch(saveScenarioQuiz(payload));
			} catch (error) {
				console.error("Error in submitting quiz", error);
			}
		},
	});


	useEffect(() => {
		if (saveQuestionResp?.statusCode === 200 && saveQuestionResp?.message) {
			toast.success(
				<p className="mx-2 tx-16 d-flex align-items-center mb-0 ">
					{saveQuestionResp?.message}
				</p>,
				{
					position: toast.POSITION.TOP_RIGHT,
					hideProgressBar: false,
					theme: "colored",
				}
			);


			dispatch(getScenarioQuizlist(querySlug));
			handleModal();
			questionForm.resetForm();
		
			dispatch(clearsaveScenarioQuiz());
			setIsLoading(false);
		}
	}, [saveQuestionResp?.statusCode]); 

	useEffect(() => {
		if (errorData?.statusCode) {
			
			let content;
			if (errorData.errors && errorData.errors.length > 0) {
				content = errorData.errors.map((msg, idx) => (
					<p key={idx} className="mx-2 tx-16 d-flex align-items-center mb-0">
						{msg}
					</p>
				));
			} else {
				content = (
					<p className="mx-2 tx-16 d-flex align-items-center mb-0">
						{errorData.message}
					</p>
				);
			}

			toast.error(content, {
				position: toast.POSITION.TOP_RIGHT,
				hideProgressBar: true,
				theme: "colored",
			});

			dispatch(clearHasError());
			setIsLoading(false);

		}
	}, [errorData]);


	const getSelectStyles = (fieldName) => {
		const error =
			!questionForm.values[fieldName] &&
			questionForm.errors[fieldName] &&
			questionForm.touched[fieldName];
		return error
			? {
				...customStyles,
				control: (styles) => ({
					...styles,
					borderColor: "#EB5757",
					boxShadow: "0 0 0 0.001rem #EB5757",
				}),
			}
			: customStyles;
	};

	const handleChange = (index, event) => {
		const { name, value } = event.target;
		const answers = [...questionForm.values.answers];
		if (!value) {
			answers[index] = { ...answers[index], ans_text: value, is_correct: { value: "No", label: "N" } };
		} else {
			answers[index] = { ...answers[index], [name]: value };
		} // Update specific answer
		questionForm.setFieldValue("answers", answers);
	};

	const handleSelectChange = (index, selectedOption) => {
		const answers = [...questionForm.values.answers];
		answers[index].is_correct = selectedOption; // Update the selected option
		questionForm.setFieldValue("answers", answers);
	};

	const clearForm = () => {
		questionForm.resetForm()
	}


	return (
		<Modal show={openModal} backdrop="static" size="xl">
			<Form
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					questionForm.handleSubmit();
					return false;
				}}
			>
				<Modal.Header>
					<Modal.Title>Scenario Questions</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Row>
						<Form.Group
							as={Col}
							lg={8}
							controlid="validationFormik102"
							className="mb-3"
						>
							<Form.Label>Question <span className="text-danger">*</span> </Form.Label>
							<Form.Control
								type="text"
								name="question_text"
								value={questionForm.values.question_text}
								onChange={questionForm.handleChange}
								placeholder="Enter Question"
								isValid={
									questionForm.touched.question_text &&
									!questionForm.errors.question_text
								}
								isInvalid={
									questionForm.touched.question_text &&
									questionForm.errors.question_text
								}
							/>
							<Form.Control.Feedback type="invalid">
								{questionForm.errors.question_text}
							</Form.Control.Feedback>
						</Form.Group>

						<Form.Group
							as={Col}
							md="4"
							controlid="1_17"
							className="mb-3 h-62 input-container select"
						>
							<Form.Label>Question Type<span className="text-danger">*</span>
							</Form.Label>
							<Select
								name="question_type"
								placeholder='Select Question type'
								theme={(theme) => ({
									...theme,
									borderRadius: 3,
									colors: {
										...theme.colors,
										primary25: "var(--primary-bg-color)",
										primary: "var(--primary-bg-color)",
									},
								})}
								value={questionForm.values.question_type}
								styles={getSelectStyles("question_type")}
								options={questionType}
								getOptionLabel={(x) => x.label}
								getOptionValue={(x) => x.value}
								onChange={(e) =>
									questionForm.setFieldValue("question_type", e)
								}
							/>

							{questionForm.errors.question_type &&
								questionForm.touched.question_type && (
									<div className="invalid-tooltiped">
										{questionForm.errors.question_type}
									</div>
								)}
						</Form.Group>

						{questionForm.values.answers.map((answer, index) => (
							<Form.Group
								as={Col}
								lg={6}
								controlid="validationFormik102"
								className="mb-3"
							>
								<Form.Label>
									Answer {index + 1}
									{index < 2 && <span className="text-danger"> *</span>}
								</Form.Label>
								<Row className='row-sm'>
									<Col md={8}>
										<Form.Control
											type="text"
											name="ans_text"
											value={answer.ans_text}
											onChange={(event) => handleChange(index, event)}
											placeholder="Enter Answer"
											autoComplete='off'
											isInvalid={questionForm.touched.answers && questionForm.errors.answers && questionForm.errors.answers[index]?.ans_text}
										/>
										<Form.Control.Feedback type="invalid">
											{questionForm.errors.answers && questionForm.errors.answers.length > 0 && questionForm.errors.answers[index]?.ans_text}
										</Form.Control.Feedback>
									</Col>
									<Col md={4}>
										<Select
											name={`answers[${index}].is_correct`}
											placeholder='Select Question type'
											theme={(theme) => ({
												...theme,
												borderRadius: 3,
												colors: {
													...theme.colors,
													primary25: "var(--primary-bg-color)",
													primary: "var(--primary-bg-color)",
												},
											})}
											value={answer.is_correct}
											styles={getSelectStyles("answers[${index}].is_correct")}
											options={[{ value: "Yes", label: "Y" }, { value: "No", label: "N" }]}
											getOptionLabel={(x) => x.label}
											getOptionValue={(x) => x.value}
											onChange={(e) =>
												handleSelectChange(index, e)
											}
											isDisabled={!answer.ans_text}
										/>
									</Col>
								</Row>
							</Form.Group>
						))}
					</Row>
					<Row>
						<Col md={12} className='text-end'>

							{!isLoading ? (
								<Button type='submit'>Submit</Button>
							) : (
								<Button
									variant="primary" disabled={isLoading}
								>
									<Spinner
										as="span"
										animation="border"
										size="sm"
										role="status"
										aria-hidden="true"
									/>
									<span className="">{t("Loading...")}</span>
								</Button>
							)}&nbsp;
							<Button variant='secondary' onClick={() => { handleModal(); clearForm() }}>Close</Button>
						</Col>
					</Row>
				</Modal.Body>
			</Form>
		</Modal>
	)
}

export default CreateQuestions