import React, { useMemo, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  Stack,
  Chip,
  Button,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  UnfoldMore as ExpandAllIcon,
  UnfoldLess as CollapseAllIcon,
  AccountTree as TreeIcon,
} from '@mui/icons-material';
import { FixedSizeList as List } from 'react-window';
import { useTreeData } from '../../hooks/useTreeData';

interface TreeTableColumn {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: any, row: any) => React.ReactNode;
}

interface TreeTableProps {
  data: any[];
  columns: TreeTableColumn[];
  idField?: string;
  parentIdField?: string;
  height?: number;
  rowHeight?: number;
  enableVirtualization?: boolean;
  onRowClick?: (row: any) => void;
  renderRowActions?: (row: any) => React.ReactNode;
}

interface TreeRowProps {
  node: any;
  columns: TreeTableColumn[];
  onToggle: (nodeId: string | number) => void;
  onRowClick?: (row: any) => void;
  renderRowActions?: (row: any) => React.ReactNode;
  style?: React.CSSProperties;
}

const TreeRow: React.FC<TreeRowProps> = ({
  node,
  columns,
  onToggle,
  onRowClick,
  renderRowActions,
  style,
}) => {
  const theme = useTheme();
  const indentSize = 24;
  const indent = node.level * indentSize;

  const handleRowClick = useCallback(() => {
    if (onRowClick) {
      onRowClick(node);
    }
  }, [node, onRowClick]);

  const handleToggleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
  }, [node.id, onToggle]);

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      sx={{
        cursor: onRowClick ? 'pointer' : 'default',
        backgroundColor: node.level > 0 ? `rgba(${theme.palette.primary.main}, 0.02)` : 'inherit',
        ...style,
      }}
    >
      {columns.map((column, index) => (
        <TableCell
          key={column.id}
          align={column.align || 'left'}
          sx={{
            minWidth: column.minWidth,
            pl: index === 0 ? `${indent + 16}px` : undefined,
          }}
        >
          {index === 0 && (
            <Stack direction="row" alignItems="center" spacing={1}>
              {node.hasChildren ? (
                <IconButton
                  size="small"
                  onClick={handleToggleClick}
                  sx={{ 
                    p: 0.5,
                    color: theme.palette.primary.main,
                  }}
                >
                  {node.isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              ) : (
                <Box sx={{ width: 24, height: 24 }} />
              )}
              <Box sx={{ flex: 1 }}>
                {column.format ? column.format(node[column.id], node) : node[column.id]}
              </Box>
            </Stack>
          )}
          {index > 0 && (
            <>
              {column.format ? column.format(node[column.id], node) : node[column.id]}
            </>
          )}
          {index === columns.length - 1 && renderRowActions && (
            <Box sx={{ ml: 1 }}>
              {renderRowActions(node)}
            </Box>
          )}
        </TableCell>
      ))}
    </TableRow>
  );
};

const VirtualizedTreeRow: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: {
    nodes: any[];
    columns: TreeTableColumn[];
    onToggle: (nodeId: string | number) => void;
    onRowClick?: (row: any) => void;
    renderRowActions?: (row: any) => React.ReactNode;
  };
}> = ({ index, style, data }) => {
  const { nodes, columns, onToggle, onRowClick, renderRowActions } = data;
  const node = nodes[index];

  return (
    <div style={style}>
      <TreeRow
        node={node}
        columns={columns}
        onToggle={onToggle}
        onRowClick={onRowClick}
        renderRowActions={renderRowActions}
      />
    </div>
  );
};

export const TreeTable: React.FC<TreeTableProps> = ({
  data,
  columns,
  idField = 'id',
  parentIdField = 'parentId',
  height = 400,
  rowHeight = 53,
  enableVirtualization = false,
  onRowClick,
  renderRowActions,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string | number>>(new Set());

  const {
    treeData,
    flattenedData,
    toggleNode,
    expandAll,
    collapseAll,
  } = useTreeData({
    data,
    idField,
    parentIdField,
    expandedNodes,
  });

  const handleToggle = useCallback((nodeId: string | number) => {
    toggleNode(nodeId);
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, [toggleNode]);

  const handleExpandAll = useCallback(() => {
    expandAll();
    const allNodeIds = new Set<string | number>();
    const collectIds = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.hasChildren) {
          allNodeIds.add(node.id);
        }
        if (node.children) {
          collectIds(node.children);
        }
      });
    };
    collectIds(treeData);
    setExpandedNodes(allNodeIds);
  }, [expandAll, treeData]);

  const handleCollapseAll = useCallback(() => {
    collapseAll();
    setExpandedNodes(new Set());
  }, [collapseAll]);

  const hasExpandableNodes = useMemo(() => {
    return treeData.some(node => node.hasChildren);
  }, [treeData]);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <TreeIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Tree Controls */}
      {hasExpandableNodes && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="textSecondary">
              Tree Controls:
            </Typography>
            <Button
              size="small"
              startIcon={<ExpandAllIcon />}
              onClick={handleExpandAll}
              variant="outlined"
            >
              Expand All
            </Button>
            <Button
              size="small"
              startIcon={<CollapseAllIcon />}
              onClick={handleCollapseAll}
              variant="outlined"
            >
              Collapse All
            </Button>
            <Chip
              label={`${flattenedData.length} of ${data.length} visible`}
              size="small"
              variant="outlined"
            />
          </Stack>
        </Box>
      )}

      {/* Table */}
      <TableContainer sx={{ height: enableVirtualization ? height : 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sx={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          {!enableVirtualization && (
            <TableBody>
              {flattenedData.map((node) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  columns={columns}
                  onToggle={handleToggle}
                  onRowClick={onRowClick}
                  renderRowActions={renderRowActions}
                />
              ))}
            </TableBody>
          )}
        </Table>
        
        {enableVirtualization && (
          <List
            height={height - 56} // Subtract header height
            itemCount={flattenedData.length}
            itemSize={rowHeight}
            itemData={{
              nodes: flattenedData,
              columns,
              onToggle: handleToggle,
              onRowClick,
              renderRowActions,
            }}
          >
            {VirtualizedTreeRow}
          </List>
        )}
      </TableContainer>
    </Box>
  );
};

export default TreeTable; 