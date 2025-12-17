import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; 
import { Row, Col, Card, Button, Table } from "react-bootstrap"; 
import { useRouter } from "next/router";
import { getSingleBatch, clearSingleBatch } from "../../../../shared/redux/slices/batches/batches"; 
import Seo from "../../../../shared/layout-components/seo/seo"; 
import '../../../../shared/utils/i18n'
import { useTranslation } from "react-i18next";

const BatchesView = () => {
    const dispatch = useDispatch();
    const { query, push } = useRouter();
    const { t } = useTranslation();    
    const [rowId, setRowId] = useState('');
    const [rowValues, setRowValues] = useState({});
    const  backTo  = query && query.backView; 
    const {
      getSingleComponentSucc
    } = useSelector((state) => { 
      return {
          getSingleComponentSucc:
          state?.batches?.singleBatch?.data,
      };
    });

    useEffect(() => {
        if (getSingleComponentSucc && getSingleComponentSucc !== "") { 
            const learners = getSingleComponentSucc.learner_data || [];
            const studentNames = learners.map(learner => learner.learner_name); 
            setRowValues({
                ...getSingleComponentSucc,
                selectedStudents: studentNames, 
            });
        }
    }, [getSingleComponentSucc]);
    

    useEffect(() => {
        if (query.slug) {
            setRowId(query.slug[0]);
            dispatch(getSingleBatch(query.slug[0]));
        }
    }, [query.slug]);

    return (
        <> 
            <Seo title="Manage Component" />
            <Row className="view-component-row-sm">
                <Col md={12}>
                    <Card className="view-component-card overflow-hidden">
                        <Card.Body className="p-3">
                            <Row className="view-component-row-sm">
                                <Col md={12}>
                                    <div className='d-flex justify-content-between view-component-mb-4'>
                                        <h4 className='view-component-card-header'>
                                            View Batches
                                        </h4>
                                        <div className="mt-0 ms-2">
                                            <Button 
                                                variant="outline-secondary" 
                                                type="button" 
                                                onClick={() => { 
                                                    push(`/batches?view=${backTo || 'list'}`);
                                                   // push("/batches/");
                                                    dispatch(clearSingleBatch())}} 
                                                className="view-component-button">
                                                <i className='fe fe-arrow-left'></i>&nbsp;{t("")}
                                            </Button>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <Row className='mb-2'>     
                                        <Col md={3} className='view-component-value-wrapper'>
                                            <label className='view-component-label text-dark m-0 '>Batch Name</label>
                                            <div className="view-component-value">{rowValues?.batchname}</div>
                                        </Col>

                                        <Col md={3} className='view-component-value-wrapper'>
                                            <label className='view-component-label text-dark m-0 '>Created By</label>
                                            <div className="view-component-value">{rowValues?.createdby_username}</div>
                                        </Col>

                                        <Col md={6} className='view-component-value-wrapper view-component-d-flex'>
                                            <div>
                                                <label className='view-component-label text-dark m-0'>Student's Name</label>
                                                <div className="view-component-value">
                                                <Table striped bordered hover>
                                                <thead>
                                                    <tr>
                                                        <th>{t("batches.label.firstname")}</th>
                                                        <th>{t("batches.label.lastname")}</th>
                                                        <th>{t("batches.label.email")}</th>
                                                        <th>{t("batches.label.mobile")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {getSingleComponentSucc?.learner_data?.map((learner, index) => (
                                                        <tr key={index}>
                                                            <td>{learner.firstname}</td>
                                                            <td>{learner.lastname}</td>
                                                            <td>{learner.email}</td>
                                                            <td>{learner.mobile}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                   
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

BatchesView.layout = "Contentlayout";
export default BatchesView;
