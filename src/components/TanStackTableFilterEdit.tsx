import { useRef, useCallback, useMemo, useState, useReducer, useEffect, InputHTMLAttributes } from 'react'

import {
  Column,
  Table,
  useReactTable,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  sortingFns,
  getSortedRowModel,
  FilterFn,
  SortingFn,
  ColumnDef,
  flexRender,
  RowData,
  
  FilterFns,
} from '@tanstack/react-table'

import {
  RankingInfo,
  rankItem,
  compareItems,
} from '@tanstack/match-sorter-utils'



//import makeData from './makeData'
import { PROJECTTASKS, ProjectTasksView, getTimeStr, getDurationStr, maskMobile, maskEmail, generateOneProjectTask } from './faker';


declare module '@tanstack/table-core' {
  /*
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }*/
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

function GetInput({ getValue, row: { index }, column: { id }, table }) {
  const initialValue = getValue()
  // We need to keep and update the state of the cell normally
  const [value, setValue] = useState(initialValue)

  // When the input is blurred, we'll call our table meta's updateData function
  const onBlur = () => {
    table.options.meta?.updateData(index, id, value)
  }

  // If the initialValue is changed external, sync it up with our state
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <input
      value={value as string}
      onChange={e => setValue(e.target.value)}
      onBlur={onBlur}
    />
  )
}


// Give our default column cell renderer editing superpowers!
const defaultColumn: Partial<ColumnDef<ProjectTasksView>> = {
  cell: ({ getValue, row, column, table }) => GetInput({ getValue, row, column, table })
}

function useSkipper() {
  const shouldSkipRef = useRef(true)
  const shouldSkip = shouldSkipRef.current

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = useCallback(() => {
    shouldSkipRef.current = false
  }, [])

  useEffect(() => {
    shouldSkipRef.current = true
  })

  return [shouldSkip, skip] as const
}


const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank,
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}


// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id },
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = useMemo(() => {
    const options = new Set()
    preFilteredRows.forEach(row => {
      options.add(row.values[id])
    })
    return [...options.values()] as string[]
  }, [id, preFilteredRows])

  // Render a multi-select box
  return (
    <select
      value={filterValue}
      onChange={e => {
        setFilter(e.target.value || undefined)
      }}
    >
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}


const fuzzySort: SortingFn<any> = (rowA, rowB, columnId) => {
  let dir = 0

  // Only sort by rank if the column has ranking information
  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank!,
      rowB.columnFiltersMeta[columnId]?.itemRank!
    )
  }

  // Provide an alphanumeric fallback for when the item ranks are equal
  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir
}


/////////////

export default function App() {
  const rerender = useReducer(() => ({}), {})[1]

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    []
  )
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<ProjectTasksView, any>[]>(
    () => [
      {
        header: 'Project CheckIn/Out',
        footer: props => props.column.id,
        columns: [
          {
            accessorKey: 'status',
            header: () => 'Status',
            footer: props => props.column.id,
            Filter: SelectColumnFilter, // maybe from v7..
            filter: 'includes',
          },
          {
            accessorFn: row => getTimeStr(row.checkIn),
            id: 'checkIn',
            header: 'checkIN',
            cell: info => info.getValue(),
            footer: props => props.column.id,
            //filterFn: 'fuzzy',
            enableColumnFilter: false,
            sortingFn: fuzzySort,
          },
          {
            accessorFn: row => getTimeStr(row.checkOut),
            id: 'checkOut',
            header: 'checkOUT',
            cell: info => info.getValue(),
            footer: props => props.column.id,
            //filterFn: 'fuzzy',
            enableColumnFilter: false,
            sortingFn: fuzzySort,
          },
          {
            accessorKey: 'name',
            header: () => 'Name',
            footer: props => props.column.id,
          },
          // {
          //   accessorKey: 'mobile',
          //   header: () => 'Mobile',
          //   footer: props => props.column.id,
          // },
          {
            accessorFn: row => maskMobile(row.mobile),
            id: 'mobile',
            header: 'Mobile',
            cell: info => info.getValue(),
            footer: props => props.column.id,
            //filterFn: 'fuzzy',
            enableColumnFilter: false,
            sortingFn: fuzzySort,
          },
          // {
          //   accessorKey: 'email',
          //   header: () => 'Email',
          //   footer: props => props.column.id,
          // },
          {
            accessorFn: row => maskEmail(row.email),
            id: 'email',
            header: 'Email',
            cell: info => info.getValue(),
            footer: props => props.column.id,
            //filterFn: 'fuzzy',
            enableColumnFilter: false,
            sortingFn: fuzzySort,
          },
          {
            accessorKey: 'zip',
            header: () => 'Zip',
            footer: props => props.column.id,
          },
          // {
          //   accessorKey: 'address',
          //   header: () => 'Address',
          //   enableColumnFilter: false,
          //   footer: props => props.column.id,
          // },
          {
            accessorFn: row => maskEmail(row.address.slice(0, 15)+".."),
            id: 'address',
            header: 'Address',
            cell: info => info.getValue(),
            footer: props => props.column.id,
            //filterFn: 'fuzzy',
            enableColumnFilter: false,
            sortingFn: fuzzySort,
          },
        ]
      }
                                
],
[]
)


const [data, setData] = useState<ProjectTasksView[]>(() => PROJECTTASKS)
const refreshData = () => setData(old => PROJECTTASKS)

// const [data, setData] = useState<ProjectTasksView[]>(() => makeData(50000))
// const refreshData = () => setData(old => makeData(50000))


const addRow = () => {
  const newRow = generateOneProjectTask({ projectIdx:1, staffIdx:1 })  
  setData( old => [ ...old, newRow ])
}

const updateRowAtIdx = ({ idx=0, checkIn=null, checkOut=null }) => {
  //const idx = 3//data.length-1
  let editRow = data[idx]
  if (!!checkIn) editRow.checkIn = Date.now()
  if (!!checkOut) editRow.checkOut = Date.now()
  console.log('editRow:', editRow)
  //const newRow = generateOneProjectTask({ projectIdx:1, staffIdx:1 })  
  setData( old => [ ...data.slice(0,idx), editRow, ...data.slice(idx+1)])
  //setData( old => [  ...old, editRow ])
}

/////////

const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper()

const table = useReactTable({
  data,
  columns,
  defaultColumn,
  filterFns: {
    fuzzy: fuzzyFilter,
  },
  state: {
    columnFilters,
    globalFilter,
  },
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
  globalFilterFn: fuzzyFilter,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
  getFacetedMinMaxValues: getFacetedMinMaxValues(),
  debugTable: true,
  debugHeaders: true,
  debugColumns: false,
  autoResetPageIndex,
    // Provide our updateData function to our table meta
    meta: {
      updateData: (rowIndex, columnId, value) => {
        // Skip age index reset until after next rerender
        skipAutoResetPageIndex()
        setData(old =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex]!,
                [columnId]: value,
              }
            }
            return row
          })
        )
      },
    }
})

  useEffect(() => {
    if (table.getState().columnFilters[0]?.id === 'status') {   // not working
      if (table.getState().sorting[0]?.id !== 'status') {
        table.setSorting([{ id: 'status', desc: false }])
      }
    }
  }, [table.getState().columnFilters[0]?.id])


  return (
    <div className="">
      <div>
        <DebouncedInput
          value={globalFilter ?? ''}
          onChange={value => setGlobalFilter(String(value))}
          className="p-2 font-lg shadow border border-block"
          placeholder="Search all columns..."
        />
      </div>
      <div className="h-2" />

      <div className="flex flex-col">
        <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden">

              <table className="min-w-full" >
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="focus:outline-none h-16 border border-white-100 rounded">
                      {headerGroup.headers.map(header => {
                        return (
                          <th key={header.id} colSpan={header.colSpan} scope="col" className="text-sm font-medium text-gray-900 px-6 py-4 text-left">
                            {header.isPlaceholder ? null : (
                              <>
                                <div
                                  {...{
                                    className: header.column.getCanSort()
                                      ? 'cursor-pointer select-none'
                                      : '',
                                    onClick: header.column.getToggleSortingHandler(),
                                  }}
                                >
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                  {{
                                    asc: ' 🔼',
                                    desc: ' 🔽',
                                  }[header.column.getIsSorted() as string] ?? null}
                                </div>
                                { /*header.column.getCanFilter() ? (
                                  <div>
                                    <Filter column={header.column} table={table} />

                                  </div>
                                ) : null */ }
                              </>
                            )}
                          </th>
                        )
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map( (row, idx) => {
                    return (
                      <tr key={row.id} className={`${ (idx+1) % 2 ? "bg-white text-gray-900" : "bg-gray-100 text-white-900"} border-b`}>
                      
                        {row.getVisibleCells().map(cell => {
                          return (
                            <td key={cell.id} className="text-sm font-light px-6 py-4 whitespace-nowrap">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="h-2" />
      <div className="flex items-center gap-2">
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          {'<<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {'<'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {'>'}
        </button>
        <button
          className="border rounded p-1"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          {'>>'}
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <span className="flex items-center gap-1">
          | Go to page:
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              table.setPageIndex(page)
            }}
            className="border p-1 rounded w-16"
          />
        </span>
        <select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div>{table.getPrePaginationRowModel().rows.length} Rows</div>
      <div>
        <button onClick={() => rerender()}>Force Rerender</button>
      </div>
      <div>
        <button onClick={() => refreshData()}>Refresh Data</button>
      </div>

      <div>
        <button onClick={() => addRow()}>Add Row</button>
      </div>

      <div>
        <button onClick={() => updateRowAtIdx({ idx: 1, checkOut: Date.now() })}>Update CheckOut of 2nd row</button>
      </div>

      <pre>{ /* JSON.stringify(table.getState(), null, 2) */ }</pre>
    </div>
  )
}



////////////////



function Filter({
  column,
  table,
}: {
  column: Column<any, unknown>
  table: Table<any>
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id)

  const columnFilterValue = column.getFilterValue()

  const sortedUniqueValues = useMemo(
    () =>
      typeof firstValue === 'number'
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()]
  )

  return typeof firstValue === 'number' ? (
    <div>
      <div className="flex space-x-2">
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
          value={(columnFilterValue as [number, number])?.[0] ?? ''}
          onChange={value =>
            column.setFilterValue((old: [number, number]) => [value, old?.[1]])
          }
          placeholder={`Min ${
            column.getFacetedMinMaxValues()?.[0]
              ? `(${column.getFacetedMinMaxValues()?.[0]})`
              : ''
          }`}
          className="w-24 border shadow rounded"
        />
        <DebouncedInput
          type="number"
          min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
          max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
          value={(columnFilterValue as [number, number])?.[1] ?? ''}
          onChange={value =>
            column.setFilterValue((old: [number, number]) => [old?.[0], value])
          }
          placeholder={`Max ${
            column.getFacetedMinMaxValues()?.[1]
              ? `(${column.getFacetedMinMaxValues()?.[1]})`
              : ''
          }`}
          className="w-24 border shadow rounded"
        />
      </div>
      <div className="h-1" />
    </div>
  ) : (
    <>
      <datalist id={column.id + 'list'}>
        {sortedUniqueValues.slice(0, 500).map((value: any) => (
          <option value={value} key={value} />
        ))}
      </datalist>
      <DebouncedInput
        type="text"
        value={(columnFilterValue ?? '') as string}
        onChange={value => column.setFilterValue(value)}
        placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
        className="w-36 border shadow rounded"
        list={column.id + 'list'}
      />
      <div className="h-1" />
    </>
  )
}

// A debounced input react component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
    
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value])

  return (
    <input {...props} value={value} onChange={e => setValue(e.target.value)} />
  )
}



/*
type ProjectTasksView = {
userId: faker.datatype.uuid(),
    //username: faker.internet.userName(),
    name: faker.name.lastName() + " " + faker.name.firstName(),
    password: faker.internet.password(),

    address: faker.address.streetAddress(true), // // '3393 Ronny Way Apt. 742'
    zip: faker.address.zipCode('####'), // '6925'
    registeredAt: new Date( faker.date.betweens('2020-01-01T00:00:00.000Z', '2022-09-01T00:00:00.000Z', 1)[0]).getTime(),
    isMale: Math.random() > 0.5,

    email: faker.internet.email(),
    mobile: faker.phone.number('+11 91 ### ## ##'), // '+48 91 463 61 70'

    halal: Math.random() > 0.5,

    taskId: faker.datatype.uuid(),
    projectId, //: faker.datatype.uuid(),

    userId, //: faker.datatype.uuid(),
    staffId, //: faker.datatype.uuid(),

    // 4h ~ 3h ago
    checkIn: new Date( faker.date.betweens(Date.now()-(1000*3600*4), Date.now()-(1000*3600*3), 1)[0]).getTime(),

    // 2h ~ 1h ago, only some users are checked out already..
    checkOut: Math.random() > 0.5 
        ? new Date( faker.date.betweens(Date.now()-(1000*3600*2), Date.now()-(1000*3600*1), 1)[0]).getTime() 
        : undefined,

    reward: Math.floor( 1+Math.random()*900), 


    projectName, 
    status
}
*/                  