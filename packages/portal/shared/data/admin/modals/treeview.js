import React, { useState, Fragment, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal, Button,Spinner } from "react-bootstrap";
import Box from "@mui/material/Box";
import TreeItem, { treeItemClasses } from "@mui/lab/TreeItem";
import TreeView from "@mui/lab/TreeView";
import CheckBoxIcon from '@mui/icons-material/CheckBox';import { styled } from "@mui/material/styles";
import { CheckBoxOutlineBlankIcon } from "@mui/icons-material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import Typography from "@mui/material/Typography";
import {  addIdRoleMenu, clearAddIdRoleMenu} from "../../../redux/slices/admin/Roles";
import Checkbox from '@mui/material/Checkbox';
import { toast } from "react-toastify";

const StyledTreeItemRoot = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.text.secondary,
  [`& .${treeItemClasses.content}`]: {
    color: theme.palette.text.secondary,
    borderTopRightRadius: theme.spacing(2),
    borderBottomRightRadius: theme.spacing(2),
    paddingRight: theme.spacing(1),
    fontWeight: theme.typography.fontWeightMedium,
    "&.Mui-expanded": {
      fontWeight: theme.typography.fontWeightRegular,
    },
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    "&.Mui-focused, &.Mui-selected, &.Mui-selected.Mui-focused": {
      backgroundColor: `var(--tree-view-bg-color, ${theme.palette.action.selected})`,
      color: "var(--tree-view-color)",
    },
    [`& .${treeItemClasses.label}`]: {
      fontWeight: "inherit",
      color: "inherit",
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 0,
    [`& .${treeItemClasses.content}`]: {
      paddingLeft: theme.spacing(2),
    },
  },
}));

function StyledTreeItem(props) {

  const {
    bgColor,
    color,
    labelIcon: LabelIcon,
    labelInfo,
    labelText,
    checked,
    ...other
  } = props;

  return (
    <StyledTreeItemRoot
      label={
        <Box sx={{ display: "flex", alignItems: "center", p: 0.5, pr: 0 }}>
          <Box component={Checkbox} checked={checked} color="inherit" sx={{ mr: 1 }} />
          <Typography
            variant="body2"
            sx={{ fontWeight: "inherit", flexGrow: 1 }}
          >
            {labelText}
          </Typography>
          <Typography variant="caption" color="inherit">
            {labelInfo}
          </Typography>
        </Box>
      }
      style={{
        "--tree-view-color": color,
        "--tree-view-bg-color": bgColor,
      }}
      {...other}
    />
  );
}

const TreeViews = (props) => {
  const { openFlag, handleFormModal, rowValues,oneClicktree,handleOneClickTree } = props;
  const dispatch = useDispatch();
  const [checked, setChecked] = useState({});
  const [menuIds, setMenuIds] = useState([]);

  const { TreeDatas,updateTreeDatas } = useSelector((state) => {
    return {
      TreeDatas:
        state &&
        state.roles &&
        state.roles.getIdByRole &&
        state.roles.getIdByRole.data,

      updateTreeDatas:
        state &&
        state.roles &&
        state.roles.addIdRoleMenu,
    };
  });
  useEffect(() => {
    if(updateTreeDatas?.statusCode === 200){
      toast.success(
        <p className="mx-2 tx-16 d-flex align-items-center mb-0">
          {updateTreeDatas?.message}
        </p>,
        {
          position: toast.POSITION.TOP_RIGHT,
          hideProgressBar: true,
          theme: "colored",
        }
      );
      dispatch(clearAddIdRoleMenu())
      viewDemoShow(false);
    }
  }, [updateTreeDatas]);  
  
  const handleChange = (event, menuId) => {
    const isChecked = event.target.checked;
    setChecked((prevItems) => ({
      ...prevItems,
      [menuId]: isChecked,
    }));
   
    if (isChecked && !menuIds.includes(menuId)) {
      setMenuIds((prevMenuIds) => [...prevMenuIds, menuId]);   
    } else if (!isChecked && menuIds.includes(menuId)) {
      setMenuIds((prevMenuIds) => menuIds.filter((id) => id !== menuId));
    }
  };
 
  useEffect(() => {
    if (TreeDatas && TreeDatas.length > 0) {
      const newChecked = {};
      const newMenuIds = [];
      TreeDatas.forEach((data) => {
        newChecked[data.menuid] = data.rolemenumapid !== null;
        if(data.rolemenumapid !== null){
          newMenuIds.push(data.menuid)
        }
       });
      setMenuIds(newMenuIds)
      setChecked(newChecked);
    }
  }, [TreeDatas]);

  const renderTreeItems = (nodes, parentId = undefined) => {
    if (!nodes || !Array.isArray(nodes)) {
      return null;
    }

    return nodes
      .filter((node) => (parentId ? node.parentId === parentId : !node.parentId))
      .map((node) => {
        const hasChildren = node.children && node.children.length > 0;
        const isChecked = checked && Object.keys(checked).length > 0 && checked[node.menuid];

        return (
          <StyledTreeItem
            key={node.menuid}
            nodeId={node.menuid.toString()}
            labelText={node.menuname}
            checked={isChecked}
            onChange={(event) => {handleChange(event, node.menuid)} }
            labelIcon={
              <checkbox
                name={node.menuid}
                checked={isChecked}
                
              />
            }
          >
            {hasChildren && renderTreeItems(node.children, node.menuid)}
          </StyledTreeItem>
        );
      });
  };
  
  const viewDemoShow = (modal) => {
    setMenuIds([])
    if (modal === false) {
      handleFormModal(false);
    }
  };

  const handleAddIdCheck = () =>{
    const payload = { 
      "menuid": menuIds , 
      "roleid": rowValues?.roleid ? rowValues?.roleid.toString() : ""
    }
    dispatch(addIdRoleMenu(payload))
    handleOneClickTree(true);
  }

  return (
    <>
      <Fragment>
        <Modal show={openFlag} backdrop="static">
          <Modal.Header
            closeButton
            onClick={() => {
              viewDemoShow(false);
            }}
          >
            <Modal.Title> Tree View</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <TreeView
              aria-label="gmail"
              defaultExpanded={["3"]}
              defaultCollapseIcon={<ArrowDropDownIcon />}
              defaultExpandIcon={<ArrowRightIcon />}
              defaultEndIcon={<div style={{ width: 24 }} />}
              sx={{
                height: 264,
                flexGrow: 1,
                maxWidth: 400,
                overflowY: "auto",
              }}
            >
                {renderTreeItems(TreeDatas)}
            </TreeView>
          </Modal.Body>
          <Modal.Footer>
          {oneClicktree ? (
              <Button variant="primary" disabled>
              <Spinner
              as="span"
              animation="grow"
              size="sm"
              role="status"
              aria-hidden="true"
              />
              Loading...
            </Button>
            ) 
                  : (
            <Button
              variant="primary"
              onClick={() => {
                handleAddIdCheck();
              }}
            >
              Save
            </Button>)}
            <Button
              variant="secondary"
              onClick={() => {
                viewDemoShow(false);
              }}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Fragment>
    </>
  );
};
export default TreeViews;