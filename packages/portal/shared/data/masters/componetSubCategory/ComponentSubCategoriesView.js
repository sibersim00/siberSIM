import React, {useEffect, useState, useMemo, useRef} from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Col, Row, Card,Table , ListGroup, Popover, Button, Form, Badge, Spinner } from "react-bootstrap";
import '../../../utils/i18n'
import { useTranslation } from "react-i18next";
import {  getSingleSubCat, clearSingleSubCategories } from "../../../redux/slices/masters/ComponentSubCategories";
import { useRouter } from 'next/router'; 
import dummy_network from '../../../../public/assets/img/dummy.jpg'  ;
 

const View = (props) => {
  const {setView,rowId, backView} = props; 
  const dispatch = useDispatch();
  const { query } = useRouter();
  const router = useRouter();
  const { t } = useTranslation();
  const [rowValues ,setRowValues] = useState('') 
   useEffect(() => {
     if(rowId && rowId!=="")
     {
        dispatch(getSingleSubCat(rowId));
     }
   },[rowId]) 
  const {
    singleSubCatRes,
    errorData, 
  } = useSelector((state) => {
    return {
      singleSubCatRes:
      state && state.componentsubcategories && state.componentsubcategories.singleSubCat && state.componentsubcategories.singleSubCat.data,
    };
  });

     useEffect(() => {
       if (singleSubCatRes && singleSubCatRes!=="") { 
         setRowValues(singleSubCatRes);
       }
     }, [singleSubCatRes]); 
  return (
    <>
    <style>
    {`
          /* Custom card styling */
          .custom-card {
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            border: none;
            background-color: #ffffff;
          }

          /* Styling for Card body */
          .blog-details {
            padding: 20px;
            font-family: 'Arial', sans-serif;
          }

          /* Title styles */
          .font-weight-semibold {
            font-weight: 600;
            font-size: 1.5rem;
          }

          /* Text styling for category name and description */
          .text-muted {
            font-size: 0.875rem;
            color: #6c757d;
          }

          .text-primary {
            color: #007bff;
          }

          .text {
            font-size: 1rem;
            color: #333;
          }

          /* Button styling */
          .btn-outline-secondary {
            border-color: #6c757d;
            color: #6c757d;
            background-color: transparent;
          }

          .btn-outline-secondary:hover {
            background-color: #6c757d;
            color: white;
            border-color: #6c757d;
          }

          .fe-arrow-left {
            margin-right: 8px;
          }

          /* Image styles */
          .img-fluid {
            max-width: 100%;
            height: auto;
          }

          .rounded {
            border-radius: 10px;
          }

          /* List Group styling */
          .list-group {
            margin-top: 20px;
            padding: 0;
          }

          .list-group-item {
            border-radius: 0.25rem;
            background-color: #f8f9fa;
            padding: 10px;
            border: 1px solid #ddd;
            margin-bottom: 8px;
          }

          .list-group-item.disabled {
            background-color: #f1f1f1;
            color: #6c757d;
          }

          .list-group-item-action:hover {
            background-color: #007bff;
            color: white;
          }

          /* Margin for the top of rows */
          .mg-t-10 {
            margin-top: 10px;
          }

          /* For responsiveness */
          @media (max-width: 768px) {
            .custom-card {
              margin: 10px;
            }

            .blog-details {
              padding: 15px;
            }

            .font-weight-semibold {
              font-size: 1.25rem;
            }

            .btn-outline-secondary {
              width: 100%;
            }
          }
        `}
      </style>
    <Row className="row-sm mg-t-10">
      <Col md={12}>
        <Card className="custom-card overflow-hidden">

        <Card className="view-component-card overflow-hidden">
                        <Card.Body className="p-3">
                            <Row className="view-component-row-sm">
                                <Col md={12}>
                                    <div className='d-flex justify-content-between view-component-mb-4'>
                                        <h4 className='view-component-card-header'>
                                            View Component Sub Category
                                        </h4>
                                        <div className="mt-0 ms-2">
                                            <Button
                                                variant="outline-secondary"
                                                type="button"
                                                onClick={() => { setView(backView);  dispatch(clearSingleSubCategories());}}
                                                className="view-component-button">
                                                <i className='fe fe-arrow-left'></i>{t("common.back")}
                                            </Button>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={8}>
                                    <Row className='mb-2'>
                                        <Col md={4} className='view-component-value-wrapper'>
                                            <label className='view-component-label text-dark m-0 '>Category</label>
                                            <div className="view-component-value">{rowValues?.categoryname}</div>
                                        </Col>

                                        <Col md={4} className='view-component-value-wrapper view-component-d-flex'>
                                            <div>
                                                <label className='view-component-label text-dark m-0'>  Sub Category</label>
                                                <div className="view-component-value">{rowValues?.parentcategoryname}</div>
                                            </div>
                                        </Col>

                                        <Col md={4} className='view-component-value-wrapper'>
                                            <label className='view-component-label text-dark m-0'>Description</label>
                                             <div dangerouslySetInnerHTML={{ __html: rowValues?.description }}></div>
                                        </Col>
                                    </Row>
                                    <Row></Row>
                                    
                                </Col>
                                <Col md={4}>
                                    {/* Image Preview Section */}
                                    {/* {rowValues?.subcategoryImage && ( */}
                                    <div className="rounded w-25">
                                        <img
                                              //  src={rowValues?.categoryimage ? `${process.env.API_URL_FILEMANAGER}${rowValues.categoryimage}` : dummy_network.src}
                                               src={
                                                    `${process.env.API_URL_FILEMANAGER}${rowValues?.categoryimage}` ||
                                                    dummy_network.src
                                                  }
                                            alt="Subcategory Preview"
                                        />
                                    </div>
                                    {/* )} */}
                                </Col>
                            </Row>
                            {(singleSubCatRes && singleSubCatRes.checkilistdata && singleSubCatRes.checkilistdata.length > 0) ?
                            <Row>
                                <Col md={8}>
                                    <Row className='mb-2'>
                                        <Col md={8} className='view-component-value-wrapper'>
                                            <label className='view-component-label text-dark m-0 '>Checklist</label>
                                            <div className="view-component-value">
                                                    <Table striped bordered hover>
                                                        <thead>
                                                            {/* <tr>
                                                                <th>{t("Name")}</th>
                                                                
                                                            </tr> */}
                                                        </thead>
                                                        <tbody>
                                                            {singleSubCatRes && singleSubCatRes.checkilistdata && singleSubCatRes.checkilistdata.length > 0 && singleSubCatRes.checkilistdata.map((checkilist, index) => (
                                                                <tr key={index}>
                                                                    <td>{checkilist.checklistname}</td>
                                                                  
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                </div>
                                            <div className="view-component-value"> </div>
                                        </Col>

                                       
                                    </Row>

                                </Col>
                            </Row>
                           : 
                           <></>
                          }
                        </Card.Body>
                    </Card>
                    
        
        </Card>
      </Col>
    </Row>
   
  </>
  
  )
}

View.layout = "Contentlayout"
export default View