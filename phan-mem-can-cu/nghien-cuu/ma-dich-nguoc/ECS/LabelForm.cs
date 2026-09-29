using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class LabelForm : Form
{
	private enum DragState
	{
		Move,
		LeftTop,
		LeftBottom,
		RightTop,
		RightBottom,
		Left,
		Right,
		Top,
		Bottom,
		LabelBottom,
		LabelRight,
		LabelRightBottom,
		Select
	}

	private enum PrintApp_Flag1
	{
		Barcode,
		Item,
		Sale,
		Text,
		Border,
		Area,
		Bitmap,
		Special
	}

	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource labelBindingSource;

	private LabelTableAdapter labelTableAdapter;

	private BindingNavigator labelBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private SplitContainer splitContainer;

	private DataGridView labelDataGridView;

	private BindingSource labelSortBindingSource;

	private UIDataSet uIDataSet;

	private NumericUpDown labelIDNumericUpDown;

	private ComboBox sortComboBox;

	private TextBox nameTextBox;

	private SplitContainer splitContainer2;

	private SplitContainer splitContainer3;

	private MyPanel subPanel;

	private NumericUpDown PPheightNumericUpDown;

	private NumericUpDown PPwidthNumericUpDown;

	private LabelItemTableAdapter labelItemTableAdapter;

	private BindingSource labelItemPrintBindingSource;

	private BindingSource labelItemFontBindingSource;

	private BindingSource labelItemAlignBindingSource;

	private BindingSource labelItemAngleBindingSource;

	private ComboBox angleComboBox;

	private ComboBox printComboBox;

	private NumericUpDown heightNumericUpDown;

	private NumericUpDown widthNumericUpDown;

	private NumericUpDown topNumericUpDown;

	private NumericUpDown leftNumericUpDown;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton bindingNavigatorFilter;

	private NumericUpDown PPheightMMNumericUpDown;

	private NumericUpDown PPwidthMMNumericUpDown;

	private NumericUpDown heightMMNumericUpDown;

	private NumericUpDown widthMMNumericUpDown;

	private NumericUpDown topMMNumericUpDown;

	private NumericUpDown leftMMNumericUpDown;

	private BindingNavigator labelItemBindingNavigator;

	private ToolStripButton toolStripButton1;

	private ToolStripLabel toolStripLabel1;

	private ToolStripButton toolStripButton2;

	private ToolStripButton toolStripButton3;

	private ToolStripButton toolStripButton4;

	private ToolStripSeparator toolStripSeparator2;

	private ToolStripTextBox toolStripTextBox1;

	private ToolStripSeparator toolStripSeparator3;

	private ToolStripButton toolStripButton5;

	private ToolStripButton toolStripButton6;

	private BindingSource labelItemBindingSource;

	private DataGridView labelItemDataGridView;

	private Button flagButton;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn Display;

	private ComboBox versionComboBox;

	private BindingSource labelVersionBindingSource;

	private Button alignButton;

	private ComboBox alignComboBox;

	private ComboBox fontComboBox;

	private Label alignLabel;

	private Label fontLabel;

	private ToolStripButton cloneToolStripButton;

	private SplitContainer splitContainer4;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn5;

	private DataGridViewComboBoxColumn dataGridViewTextBoxColumn4;

	private DataGridViewComboBoxColumn VersionColumn;

	private Label label_ViewOnly1;

	private Label label_ViewOnly2;

	private Label label_ViewOnly4;

	private Label label_ViewOnly3;

	private Panel View_panel;

	private Panel Edit_panel;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private ToolStripButton cloneToolStripButton2;

	private Label versionLabel;

	private Label labelIDLabel;

	private Label nameLabel;

	private Label sortLabel;

	private Label heightLabel;

	private Label widthLabel;

	private Label widthLabel1;

	private Label heightLabel1;

	private Label topLabel;

	private Label angleLabel;

	private Label leftLabel;

	private Label printLabel;

	private Label flagLabel;

	private Rectangle rcCur;

	private Rectangle rcLeftTop;

	private Rectangle rcLeftBottom;

	private Rectangle rcRightTop;

	private Rectangle rcRightBottom;

	private Rectangle rcLeft;

	private Rectangle rcRight;

	private Rectangle rcTop;

	private Rectangle rcBottom;

	private Rectangle rcLabelBottom;

	private Rectangle rcLabelRight;

	private Rectangle rcLabelRightBottom;

	private List<int> _list = new List<int>(100);

	private int _list_ct = -1;

	private bool _bIsDrag;

	private Point _ptStart;

	private int _diffX;

	private int _diffY;

	private int _left;

	private int _top;

	private int _width;

	private int _height;

	private int _labelWidth;

	private int _labelHeight;

	private DragState _dragState;

	private bool NewAdding;

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

	private bool subid_changing;

	private bool bMulti_S;

	private bool bMulti_C;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.LabelForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.splitContainer4 = new System.Windows.Forms.SplitContainer();
		this.labelDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.labelSortBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uIDataSet = new ECS.UIDataSet();
		this.VersionColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.labelVersionBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.labelBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.versionLabel = new System.Windows.Forms.Label();
		this.labelIDLabel = new System.Windows.Forms.Label();
		this.versionComboBox = new System.Windows.Forms.ComboBox();
		this.labelIDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.nameLabel = new System.Windows.Forms.Label();
		this.PPheightMMNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.sortComboBox = new System.Windows.Forms.ComboBox();
		this.PPwidthMMNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.sortLabel = new System.Windows.Forms.Label();
		this.heightLabel = new System.Windows.Forms.Label();
		this.PPwidthNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.PPheightNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.widthLabel = new System.Windows.Forms.Label();
		this.splitContainer2 = new System.Windows.Forms.SplitContainer();
		this.labelItemDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Display = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelItemBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.labelItemBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.toolStripLabel1 = new System.Windows.Forms.ToolStripLabel();
		this.toolStripButton2 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton3 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton4 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripTextBox1 = new System.Windows.Forms.ToolStripTextBox();
		this.toolStripSeparator3 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton5 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton6 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton1 = new System.Windows.Forms.ToolStripButton();
		this.cloneToolStripButton2 = new System.Windows.Forms.ToolStripButton();
		this.splitContainer3 = new System.Windows.Forms.SplitContainer();
		this.subPanel = new ECS.MyPanel();
		this.Edit_panel = new System.Windows.Forms.Panel();
		this.flagLabel = new System.Windows.Forms.Label();
		this.topNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.widthLabel1 = new System.Windows.Forms.Label();
		this.alignButton = new System.Windows.Forms.Button();
		this.heightNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.heightMMNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.widthNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.alignLabel = new System.Windows.Forms.Label();
		this.heightLabel1 = new System.Windows.Forms.Label();
		this.topLabel = new System.Windows.Forms.Label();
		this.fontLabel = new System.Windows.Forms.Label();
		this.printComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemPrintBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.widthMMNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.angleLabel = new System.Windows.Forms.Label();
		this.alignComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemAlignBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.leftLabel = new System.Windows.Forms.Label();
		this.printLabel = new System.Windows.Forms.Label();
		this.fontComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemFontBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.leftNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.topMMNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.angleComboBox = new System.Windows.Forms.ComboBox();
		this.labelItemAngleBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.leftMMNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.flagButton = new System.Windows.Forms.Button();
		this.View_panel = new System.Windows.Forms.Panel();
		this.label_ViewOnly3 = new System.Windows.Forms.Label();
		this.label_ViewOnly1 = new System.Windows.Forms.Label();
		this.label_ViewOnly2 = new System.Windows.Forms.Label();
		this.label_ViewOnly4 = new System.Windows.Forms.Label();
		this.labelBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.cloneToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.labelTableAdapter = new ECS.ECSDataSetTableAdapters.LabelTableAdapter();
		this.labelItemTableAdapter = new ECS.ECSDataSetTableAdapters.LabelItemTableAdapter();
		System.Windows.Forms.Label label = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label2 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label3 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label4 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label5 = new System.Windows.Forms.Label();
		System.Windows.Forms.Label label6 = new System.Windows.Forms.Label();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		this.splitContainer4.Panel1.SuspendLayout();
		this.splitContainer4.Panel2.SuspendLayout();
		this.splitContainer4.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelSortBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelVersionBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelIDNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PPheightMMNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PPwidthMMNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PPwidthNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.PPheightNumericUpDown).BeginInit();
		this.splitContainer2.Panel1.SuspendLayout();
		this.splitContainer2.Panel2.SuspendLayout();
		this.splitContainer2.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItemDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemBindingNavigator).BeginInit();
		this.labelItemBindingNavigator.SuspendLayout();
		this.splitContainer3.Panel1.SuspendLayout();
		this.splitContainer3.Panel2.SuspendLayout();
		this.splitContainer3.SuspendLayout();
		this.Edit_panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.topNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.heightNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.heightMMNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.widthNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemPrintBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.widthMMNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemAlignBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFontBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.leftNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.topMMNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemAngleBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.leftMMNumericUpDown).BeginInit();
		this.View_panel.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelBindingNavigator).BeginInit();
		this.labelBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.splitContainer4);
		this.splitContainer.Panel2.Controls.Add(this.splitContainer2);
		this.splitContainer4.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer4, "splitContainer4");
		this.splitContainer4.Name = "splitContainer4";
		this.splitContainer4.Panel1.Controls.Add(this.labelDataGridView);
		this.splitContainer4.Panel2.Controls.Add(this.versionLabel);
		this.splitContainer4.Panel2.Controls.Add(this.labelIDLabel);
		this.splitContainer4.Panel2.Controls.Add(this.versionComboBox);
		this.splitContainer4.Panel2.Controls.Add(this.labelIDNumericUpDown);
		this.splitContainer4.Panel2.Controls.Add(label);
		this.splitContainer4.Panel2.Controls.Add(this.nameTextBox);
		this.splitContainer4.Panel2.Controls.Add(label2);
		this.splitContainer4.Panel2.Controls.Add(this.nameLabel);
		this.splitContainer4.Panel2.Controls.Add(this.PPheightMMNumericUpDown);
		this.splitContainer4.Panel2.Controls.Add(this.sortComboBox);
		this.splitContainer4.Panel2.Controls.Add(this.PPwidthMMNumericUpDown);
		this.splitContainer4.Panel2.Controls.Add(this.sortLabel);
		this.splitContainer4.Panel2.Controls.Add(this.heightLabel);
		this.splitContainer4.Panel2.Controls.Add(this.PPwidthNumericUpDown);
		this.splitContainer4.Panel2.Controls.Add(this.PPheightNumericUpDown);
		this.splitContainer4.Panel2.Controls.Add(this.widthLabel);
		this.labelDataGridView.AllowUserToAddRows = false;
		this.labelDataGridView.AutoGenerateColumns = false;
		this.labelDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.labelDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.labelDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn5, this.dataGridViewTextBoxColumn4, this.VersionColumn);
		this.labelDataGridView.DataSource = this.labelBindingSource;
		resources.ApplyResources(this.labelDataGridView, "labelDataGridView");
		this.labelDataGridView.Name = "labelDataGridView";
		this.labelDataGridView.RowTemplate.Height = 23;
		this.labelDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.labelDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(labelDataGridView_DataError);
		this.labelDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(bindingNavigatorKeyDown);
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "LabelID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn5.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn5.DataPropertyName = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn5, "dataGridViewTextBoxColumn5");
		this.dataGridViewTextBoxColumn5.Name = "dataGridViewTextBoxColumn5";
		this.dataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn4.DataPropertyName = "Sort";
		this.dataGridViewTextBoxColumn4.DataSource = this.labelSortBindingSource;
		this.dataGridViewTextBoxColumn4.DisplayMember = "Display";
		resources.ApplyResources(this.dataGridViewTextBoxColumn4, "dataGridViewTextBoxColumn4");
		this.dataGridViewTextBoxColumn4.Name = "dataGridViewTextBoxColumn4";
		this.dataGridViewTextBoxColumn4.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridViewTextBoxColumn4.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dataGridViewTextBoxColumn4.ValueMember = "Value";
		this.labelSortBindingSource.DataMember = "Label_Sort";
		this.labelSortBindingSource.DataSource = this.uIDataSet;
		this.labelSortBindingSource.Sort = "Value";
		this.uIDataSet.DataSetName = "UIDataSet";
		this.uIDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uIDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.VersionColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.VersionColumn.DataPropertyName = "Version";
		this.VersionColumn.DataSource = this.labelVersionBindingSource;
		this.VersionColumn.DisplayMember = "Display";
		resources.ApplyResources(this.VersionColumn, "VersionColumn");
		this.VersionColumn.Name = "VersionColumn";
		this.VersionColumn.ValueMember = "Value";
		this.labelVersionBindingSource.DataMember = "Label_Version";
		this.labelVersionBindingSource.DataSource = this.uIDataSet;
		this.labelVersionBindingSource.Sort = "Value";
		this.labelBindingSource.DataMember = "Label";
		this.labelBindingSource.DataSource = this.eCSDataSet;
		this.labelBindingSource.Sort = "LabelID";
		this.labelBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(labelBindingSource_BindingComplete);
		this.labelBindingSource.CurrentChanged += new System.EventHandler(labelBindingSource_CurrentChanged);
		this.labelBindingSource.PositionChanged += new System.EventHandler(labelBindingSource_PositionChanged);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		resources.ApplyResources(this.versionLabel, "versionLabel");
		this.versionLabel.Name = "versionLabel";
		resources.ApplyResources(this.labelIDLabel, "labelIDLabel");
		this.labelIDLabel.Name = "labelIDLabel";
		this.versionComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelBindingSource, "Version", true));
		this.versionComboBox.DataSource = this.labelVersionBindingSource;
		this.versionComboBox.DisplayMember = "Display";
		this.versionComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.versionComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.versionComboBox, "versionComboBox");
		this.versionComboBox.Name = "versionComboBox";
		this.versionComboBox.ValueMember = "Value";
		this.versionComboBox.SelectionChangeCommitted += new System.EventHandler(versionComboBox_SelectionChangeCommitted);
		this.versionComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(comboBox_Format);
		this.labelIDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelBindingSource, "LabelID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.labelIDNumericUpDown, "labelIDNumericUpDown");
		this.labelIDNumericUpDown.Maximum = ECS.Properties.Settings.Default.maxLabelID;
		this.labelIDNumericUpDown.Name = "labelIDNumericUpDown";
		this.labelIDNumericUpDown.ValueChanged += new System.EventHandler(labelIDNumericUpDown_ValueChanged);
		resources.ApplyResources(label, "mmLabel1");
		label.Name = "mmLabel1";
		this.nameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.labelBindingSource, "Name", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		resources.ApplyResources(label2, "mmLabel2");
		label2.Name = "mmLabel2";
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		resources.ApplyResources(this.PPheightMMNumericUpDown, "PPheightMMNumericUpDown");
		this.PPheightMMNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.PPheightMMNumericUpDown.Name = "PPheightMMNumericUpDown";
		this.PPheightMMNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		this.sortComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelBindingSource, "Sort", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.sortComboBox.DataSource = this.labelSortBindingSource;
		this.sortComboBox.DisplayMember = "Display";
		this.sortComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.sortComboBox.DropDownWidth = 200;
		this.sortComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.sortComboBox, "sortComboBox");
		this.sortComboBox.Name = "sortComboBox";
		this.sortComboBox.ValueMember = "Value";
		this.sortComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(comboBox_Format);
		resources.ApplyResources(this.PPwidthMMNumericUpDown, "PPwidthMMNumericUpDown");
		this.PPwidthMMNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.PPwidthMMNumericUpDown.Name = "PPwidthMMNumericUpDown";
		this.PPwidthMMNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		resources.ApplyResources(this.sortLabel, "sortLabel");
		this.sortLabel.Name = "sortLabel";
		resources.ApplyResources(this.heightLabel, "heightLabel");
		this.heightLabel.Name = "heightLabel";
		this.PPwidthNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelBindingSource, "Width", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.PPwidthNumericUpDown, "PPwidthNumericUpDown");
		this.PPwidthNumericUpDown.Maximum = ECS.Properties.Settings.Default.maxLabelWidth;
		this.PPwidthNumericUpDown.Minimum = ECS.Properties.Settings.Default.minLabelWidth;
		this.PPwidthNumericUpDown.Name = "PPwidthNumericUpDown";
		this.PPwidthNumericUpDown.Value = new decimal(new int[4] { 10, 0, 0, 0 });
		this.PPwidthNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		this.PPheightNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelBindingSource, "Height", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.PPheightNumericUpDown, "PPheightNumericUpDown");
		this.PPheightNumericUpDown.Maximum = ECS.Properties.Settings.Default.maxLabelHeight;
		this.PPheightNumericUpDown.Minimum = ECS.Properties.Settings.Default.minLabelHeight;
		this.PPheightNumericUpDown.Name = "PPheightNumericUpDown";
		this.PPheightNumericUpDown.Value = new decimal(new int[4] { 10, 0, 0, 0 });
		this.PPheightNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		resources.ApplyResources(this.widthLabel, "widthLabel");
		this.widthLabel.Name = "widthLabel";
		this.splitContainer2.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer2, "splitContainer2");
		this.splitContainer2.Name = "splitContainer2";
		resources.ApplyResources(this.splitContainer2.Panel1, "splitContainer2.Panel1");
		this.splitContainer2.Panel1.Controls.Add(this.labelItemDataGridView);
		this.splitContainer2.Panel1.Controls.Add(this.labelItemBindingNavigator);
		this.splitContainer2.Panel2.Controls.Add(this.splitContainer3);
		this.labelItemDataGridView.AllowUserToAddRows = false;
		this.labelItemDataGridView.AutoGenerateColumns = false;
		this.labelItemDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.labelItemDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.labelItemDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.labelItemDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn3, this.Display);
		this.labelItemDataGridView.DataSource = this.labelItemBindingSource;
		resources.ApplyResources(this.labelItemDataGridView, "labelItemDataGridView");
		this.labelItemDataGridView.Name = "labelItemDataGridView";
		this.labelItemDataGridView.RowTemplate.Height = 23;
		this.labelItemDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.labelItemDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(labelDataGridView_DataError);
		this.labelItemDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(labelItemDataGridView_KeyDown);
		this.labelItemDataGridView.KeyUp += new System.Windows.Forms.KeyEventHandler(labelItemDataGridView_KeyUp);
		this.dataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn3.DataPropertyName = "SubID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn3, "dataGridViewTextBoxColumn3");
		this.dataGridViewTextBoxColumn3.Name = "dataGridViewTextBoxColumn3";
		this.Display.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Display.DataPropertyName = "Display";
		resources.ApplyResources(this.Display, "Display");
		this.Display.Name = "Display";
		this.Display.ReadOnly = true;
		this.labelItemBindingSource.DataMember = "FK_Label_LabelItem";
		this.labelItemBindingSource.DataSource = this.labelBindingSource;
		this.labelItemBindingSource.Sort = "";
		this.labelItemBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(labelItemBindingSource_BindingComplete);
		this.labelItemBindingSource.DataSourceChanged += new System.EventHandler(labelItemBindingSource_DataSourceChanged);
		this.labelItemBindingSource.PositionChanged += new System.EventHandler(labelItemBindingSource_PositionChanged);
		this.labelItemBindingNavigator.AddNewItem = null;
		this.labelItemBindingNavigator.BindingSource = this.labelItemBindingSource;
		this.labelItemBindingNavigator.CountItem = this.toolStripLabel1;
		this.labelItemBindingNavigator.DeleteItem = this.toolStripButton2;
		this.labelItemBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.toolStripButton3, this.toolStripButton4, this.toolStripSeparator2, this.toolStripTextBox1, this.toolStripLabel1, this.toolStripSeparator3, this.toolStripButton5, this.toolStripButton6, this.toolStripButton1, this.toolStripButton2,
			this.cloneToolStripButton2
		});
		resources.ApplyResources(this.labelItemBindingNavigator, "labelItemBindingNavigator");
		this.labelItemBindingNavigator.MoveFirstItem = this.toolStripButton3;
		this.labelItemBindingNavigator.MoveLastItem = this.toolStripButton6;
		this.labelItemBindingNavigator.MoveNextItem = this.toolStripButton5;
		this.labelItemBindingNavigator.MovePreviousItem = this.toolStripButton4;
		this.labelItemBindingNavigator.Name = "labelItemBindingNavigator";
		this.labelItemBindingNavigator.PositionItem = this.toolStripTextBox1;
		this.toolStripLabel1.Name = "toolStripLabel1";
		resources.ApplyResources(this.toolStripLabel1, "toolStripLabel1");
		this.toolStripButton2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton2, "toolStripButton2");
		this.toolStripButton2.Name = "toolStripButton2";
		this.toolStripButton3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton3, "toolStripButton3");
		this.toolStripButton3.Name = "toolStripButton3";
		this.toolStripButton4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton4, "toolStripButton4");
		this.toolStripButton4.Name = "toolStripButton4";
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		resources.ApplyResources(this.toolStripSeparator2, "toolStripSeparator2");
		resources.ApplyResources(this.toolStripTextBox1, "toolStripTextBox1");
		this.toolStripTextBox1.Name = "toolStripTextBox1";
		this.toolStripSeparator3.Name = "toolStripSeparator3";
		resources.ApplyResources(this.toolStripSeparator3, "toolStripSeparator3");
		this.toolStripButton5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton5, "toolStripButton5");
		this.toolStripButton5.Name = "toolStripButton5";
		this.toolStripButton6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton6, "toolStripButton6");
		this.toolStripButton6.Name = "toolStripButton6";
		this.toolStripButton1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.toolStripButton1, "toolStripButton1");
		this.toolStripButton1.Name = "toolStripButton1";
		this.toolStripButton1.Click += new System.EventHandler(toolStripButton1_Click);
		this.cloneToolStripButton2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.cloneToolStripButton2, "cloneToolStripButton2");
		this.cloneToolStripButton2.Name = "cloneToolStripButton2";
		this.cloneToolStripButton2.Click += new System.EventHandler(cloneToolStripButton2_Click);
		this.splitContainer3.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer3, "splitContainer3");
		this.splitContainer3.Name = "splitContainer3";
		resources.ApplyResources(this.splitContainer3.Panel1, "splitContainer3.Panel1");
		this.splitContainer3.Panel1.BackColor = System.Drawing.SystemColors.AppWorkspace;
		this.splitContainer3.Panel1.Controls.Add(this.subPanel);
		resources.ApplyResources(this.splitContainer3.Panel2, "splitContainer3.Panel2");
		this.splitContainer3.Panel2.Controls.Add(this.Edit_panel);
		this.splitContainer3.Panel2.Controls.Add(this.View_panel);
		this.subPanel.CausesValidation = false;
		resources.ApplyResources(this.subPanel, "subPanel");
		this.subPanel.Name = "subPanel";
		this.subPanel.Paint += new System.Windows.Forms.PaintEventHandler(subPanel_Paint);
		this.subPanel.MouseDoubleClick += new System.Windows.Forms.MouseEventHandler(subPanel_MouseDoubleClick);
		this.subPanel.MouseDown += new System.Windows.Forms.MouseEventHandler(subPanel_MouseDown);
		this.subPanel.MouseMove += new System.Windows.Forms.MouseEventHandler(subPanel_MouseMove);
		this.subPanel.MouseUp += new System.Windows.Forms.MouseEventHandler(subPanel_MouseUp);
		this.Edit_panel.Controls.Add(this.flagLabel);
		this.Edit_panel.Controls.Add(this.topNumericUpDown);
		this.Edit_panel.Controls.Add(label3);
		this.Edit_panel.Controls.Add(this.widthLabel1);
		this.Edit_panel.Controls.Add(this.alignButton);
		this.Edit_panel.Controls.Add(this.heightNumericUpDown);
		this.Edit_panel.Controls.Add(this.heightMMNumericUpDown);
		this.Edit_panel.Controls.Add(this.widthNumericUpDown);
		this.Edit_panel.Controls.Add(this.alignLabel);
		this.Edit_panel.Controls.Add(this.heightLabel1);
		this.Edit_panel.Controls.Add(label4);
		this.Edit_panel.Controls.Add(this.topLabel);
		this.Edit_panel.Controls.Add(this.fontLabel);
		this.Edit_panel.Controls.Add(this.printComboBox);
		this.Edit_panel.Controls.Add(this.widthMMNumericUpDown);
		this.Edit_panel.Controls.Add(this.angleLabel);
		this.Edit_panel.Controls.Add(this.alignComboBox);
		this.Edit_panel.Controls.Add(this.leftLabel);
		this.Edit_panel.Controls.Add(label5);
		this.Edit_panel.Controls.Add(this.printLabel);
		this.Edit_panel.Controls.Add(this.fontComboBox);
		this.Edit_panel.Controls.Add(this.leftNumericUpDown);
		this.Edit_panel.Controls.Add(this.topMMNumericUpDown);
		this.Edit_panel.Controls.Add(this.angleComboBox);
		this.Edit_panel.Controls.Add(this.leftMMNumericUpDown);
		this.Edit_panel.Controls.Add(label6);
		this.Edit_panel.Controls.Add(this.flagButton);
		resources.ApplyResources(this.Edit_panel, "Edit_panel");
		this.Edit_panel.Name = "Edit_panel";
		resources.ApplyResources(this.flagLabel, "flagLabel");
		this.flagLabel.Name = "flagLabel";
		this.topNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelItemBindingSource, "Top", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.topNumericUpDown, "topNumericUpDown");
		this.topNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.topNumericUpDown.Name = "topNumericUpDown";
		this.topNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		resources.ApplyResources(label3, "label4");
		label3.Name = "label4";
		resources.ApplyResources(this.widthLabel1, "widthLabel1");
		this.widthLabel1.Name = "widthLabel1";
		resources.ApplyResources(this.alignButton, "alignButton");
		this.alignButton.Name = "alignButton";
		this.alignButton.UseVisualStyleBackColor = true;
		this.alignButton.Click += new System.EventHandler(alignButton_Click);
		this.heightNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelItemBindingSource, "Height", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.heightNumericUpDown, "heightNumericUpDown");
		this.heightNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.heightNumericUpDown.Name = "heightNumericUpDown";
		this.heightNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		this.heightMMNumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.heightMMNumericUpDown, "heightMMNumericUpDown");
		this.heightMMNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.heightMMNumericUpDown.Name = "heightMMNumericUpDown";
		this.heightMMNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		this.widthNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelItemBindingSource, "Width", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.widthNumericUpDown, "widthNumericUpDown");
		this.widthNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.widthNumericUpDown.Name = "widthNumericUpDown";
		this.widthNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		resources.ApplyResources(this.alignLabel, "alignLabel");
		this.alignLabel.Name = "alignLabel";
		resources.ApplyResources(this.heightLabel1, "heightLabel1");
		this.heightLabel1.Name = "heightLabel1";
		resources.ApplyResources(label4, "label3");
		label4.Name = "label3";
		resources.ApplyResources(this.topLabel, "topLabel");
		this.topLabel.Name = "topLabel";
		resources.ApplyResources(this.fontLabel, "fontLabel");
		this.fontLabel.Name = "fontLabel";
		this.printComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelItemBindingSource, "Print", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.printComboBox.DataSource = this.labelItemPrintBindingSource;
		this.printComboBox.DisplayMember = "Display";
		this.printComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.printComboBox.DropDownWidth = 200;
		this.printComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.printComboBox, "printComboBox");
		this.printComboBox.Name = "printComboBox";
		this.printComboBox.ValueMember = "Value";
		this.printComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(comboBox_Format);
		this.labelItemPrintBindingSource.DataMember = "LabelItem_Print";
		this.labelItemPrintBindingSource.DataSource = this.uIDataSet;
		this.labelItemPrintBindingSource.Filter = "[Display] <> '#NULL#'";
		this.labelItemPrintBindingSource.Sort = "Value";
		this.widthMMNumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.widthMMNumericUpDown, "widthMMNumericUpDown");
		this.widthMMNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.widthMMNumericUpDown.Name = "widthMMNumericUpDown";
		this.widthMMNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		resources.ApplyResources(this.angleLabel, "angleLabel");
		this.angleLabel.Name = "angleLabel";
		this.alignComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelItemBindingSource, "Align", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.alignComboBox.DataSource = this.labelItemAlignBindingSource;
		this.alignComboBox.DisplayMember = "Display";
		this.alignComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.alignComboBox.DropDownWidth = 200;
		this.alignComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.alignComboBox, "alignComboBox");
		this.alignComboBox.Name = "alignComboBox";
		this.alignComboBox.ValueMember = "Value";
		this.alignComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(comboBox_Format);
		this.labelItemAlignBindingSource.DataMember = "LabelItem_Align";
		this.labelItemAlignBindingSource.DataSource = this.uIDataSet;
		this.labelItemAlignBindingSource.Sort = "Value";
		resources.ApplyResources(this.leftLabel, "leftLabel");
		this.leftLabel.Name = "leftLabel";
		resources.ApplyResources(label5, "label2");
		label5.Name = "label2";
		resources.ApplyResources(this.printLabel, "printLabel");
		this.printLabel.Name = "printLabel";
		this.fontComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelItemBindingSource, "Font", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.fontComboBox.DataSource = this.labelItemFontBindingSource;
		this.fontComboBox.DisplayMember = "Display";
		this.fontComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.fontComboBox.DropDownWidth = 200;
		this.fontComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.fontComboBox, "fontComboBox");
		this.fontComboBox.Name = "fontComboBox";
		this.fontComboBox.ValueMember = "Value";
		this.fontComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(comboBox_Format);
		this.labelItemFontBindingSource.DataMember = "LabelItem_Font1";
		this.labelItemFontBindingSource.DataSource = this.uIDataSet;
		this.labelItemFontBindingSource.Filter = "[Display] <> '#NULL#'";
		this.labelItemFontBindingSource.Sort = "Value";
		this.leftNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.labelItemBindingSource, "Left", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.leftNumericUpDown, "leftNumericUpDown");
		this.leftNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.leftNumericUpDown.Name = "leftNumericUpDown";
		this.leftNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		this.topMMNumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.topMMNumericUpDown, "topMMNumericUpDown");
		this.topMMNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.topMMNumericUpDown.Name = "topMMNumericUpDown";
		this.topMMNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		this.angleComboBox.DataBindings.Add(new System.Windows.Forms.Binding("SelectedValue", this.labelItemBindingSource, "Angle", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		this.angleComboBox.DataSource = this.labelItemAngleBindingSource;
		this.angleComboBox.DisplayMember = "Display";
		this.angleComboBox.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
		this.angleComboBox.DropDownWidth = 200;
		this.angleComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.angleComboBox, "angleComboBox");
		this.angleComboBox.Name = "angleComboBox";
		this.angleComboBox.ValueMember = "Value";
		this.angleComboBox.Format += new System.Windows.Forms.ListControlConvertEventHandler(comboBox_Format);
		this.labelItemAngleBindingSource.DataMember = "LabelItem_Angle";
		this.labelItemAngleBindingSource.DataSource = this.uIDataSet;
		this.labelItemAngleBindingSource.Sort = "Value";
		this.leftMMNumericUpDown.DecimalPlaces = 2;
		resources.ApplyResources(this.leftMMNumericUpDown, "leftMMNumericUpDown");
		this.leftMMNumericUpDown.Maximum = new decimal(new int[4] { 65536, 0, 0, 0 });
		this.leftMMNumericUpDown.Name = "leftMMNumericUpDown";
		this.leftMMNumericUpDown.ValueChanged += new System.EventHandler(NumericUpDown_ValueChanged);
		resources.ApplyResources(label6, "label1");
		label6.Name = "label1";
		this.flagButton.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.labelItemBindingSource, "Display", true));
		resources.ApplyResources(this.flagButton, "flagButton");
		this.flagButton.Name = "flagButton";
		this.flagButton.UseVisualStyleBackColor = true;
		this.flagButton.Click += new System.EventHandler(flagButton_Click);
		this.View_panel.Controls.Add(this.label_ViewOnly3);
		this.View_panel.Controls.Add(this.label_ViewOnly1);
		this.View_panel.Controls.Add(this.label_ViewOnly2);
		this.View_panel.Controls.Add(this.label_ViewOnly4);
		resources.ApplyResources(this.View_panel, "View_panel");
		this.View_panel.Name = "View_panel";
		resources.ApplyResources(this.label_ViewOnly3, "label_ViewOnly3");
		this.label_ViewOnly3.BackColor = System.Drawing.Color.Transparent;
		this.label_ViewOnly3.Cursor = System.Windows.Forms.Cursors.Hand;
		this.label_ViewOnly3.ForeColor = System.Drawing.Color.Firebrick;
		this.label_ViewOnly3.Name = "label_ViewOnly3";
		this.label_ViewOnly3.Click += new System.EventHandler(label_ViewOnly3_Click);
		resources.ApplyResources(this.label_ViewOnly1, "label_ViewOnly1");
		this.label_ViewOnly1.BackColor = System.Drawing.Color.Transparent;
		this.label_ViewOnly1.ForeColor = System.Drawing.Color.Firebrick;
		this.label_ViewOnly1.Name = "label_ViewOnly1";
		resources.ApplyResources(this.label_ViewOnly2, "label_ViewOnly2");
		this.label_ViewOnly2.BackColor = System.Drawing.Color.Transparent;
		this.label_ViewOnly2.ForeColor = System.Drawing.Color.Firebrick;
		this.label_ViewOnly2.Name = "label_ViewOnly2";
		resources.ApplyResources(this.label_ViewOnly4, "label_ViewOnly4");
		this.label_ViewOnly4.BackColor = System.Drawing.Color.Transparent;
		this.label_ViewOnly4.Cursor = System.Windows.Forms.Cursors.Hand;
		this.label_ViewOnly4.ForeColor = System.Drawing.Color.Firebrick;
		this.label_ViewOnly4.Name = "label_ViewOnly4";
		this.label_ViewOnly4.Click += new System.EventHandler(label_ViewOnly4_Click);
		this.labelBindingNavigator.AddNewItem = null;
		this.labelBindingNavigator.BindingSource = this.labelBindingSource;
		this.labelBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.labelBindingNavigator.DeleteItem = null;
		this.labelBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[17]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorAddNewItem, this.bindingNavigatorDeleteItem,
			this.cloneToolStripButton, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.labelBindingNavigator, "labelBindingNavigator");
		this.labelBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.labelBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.labelBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.labelBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.labelBindingNavigator.Name = "labelBindingNavigator";
		this.labelBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorAddNewItem.Click += new System.EventHandler(bindingNavigatorAddNewItem_Click);
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		resources.ApplyResources(this.cloneToolStripButton, "cloneToolStripButton");
		this.cloneToolStripButton.Name = "cloneToolStripButton";
		this.cloneToolStripButton.Click += new System.EventHandler(cloneToolStripButton_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
		this.bindingNavigatorGoto.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorGoto, "bindingNavigatorGoto");
		this.bindingNavigatorGoto.Name = "bindingNavigatorGoto";
		this.bindingNavigatorGoto.Click += new System.EventHandler(bindingNavigatorGoto_Click);
		this.bindingNavigatorFilter.CheckOnClick = true;
		this.bindingNavigatorFilter.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorFilter, "bindingNavigatorFilter");
		this.bindingNavigatorFilter.Name = "bindingNavigatorFilter";
		this.bindingNavigatorFilter.CheckedChanged += new System.EventHandler(bindingNavigatorFilter_CheckedChanged);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		this.labelTableAdapter.ClearBeforeFill = true;
		this.labelItemTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.labelBindingNavigator);
		base.Name = "LabelForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(LabelForm_FormClosing);
		base.Load += new System.EventHandler(LabelForm_Load);
		base.Leave += new System.EventHandler(LabelForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.ResumeLayout(false);
		this.splitContainer4.Panel1.ResumeLayout(false);
		this.splitContainer4.Panel2.ResumeLayout(false);
		this.splitContainer4.Panel2.PerformLayout();
		this.splitContainer4.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.labelDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelSortBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uIDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelVersionBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelIDNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PPheightMMNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PPwidthMMNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PPwidthNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.PPheightNumericUpDown).EndInit();
		this.splitContainer2.Panel1.ResumeLayout(false);
		this.splitContainer2.Panel1.PerformLayout();
		this.splitContainer2.Panel2.ResumeLayout(false);
		this.splitContainer2.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.labelItemDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemBindingNavigator).EndInit();
		this.labelItemBindingNavigator.ResumeLayout(false);
		this.labelItemBindingNavigator.PerformLayout();
		this.splitContainer3.Panel1.ResumeLayout(false);
		this.splitContainer3.Panel2.ResumeLayout(false);
		this.splitContainer3.ResumeLayout(false);
		this.Edit_panel.ResumeLayout(false);
		this.Edit_panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.topNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.heightNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.heightMMNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.widthNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemPrintBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.widthMMNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemAlignBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemFontBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.leftNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.topMMNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItemAngleBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.leftMMNumericUpDown).EndInit();
		this.View_panel.ResumeLayout(false);
		this.View_panel.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.labelBindingNavigator).EndInit();
		this.labelBindingNavigator.ResumeLayout(false);
		this.labelBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public LabelForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
			return;
		}
		if (Type == "Label")
		{
			NoCTRowChanged = true;
			eCSDataSet.LabelItem.Clear();
			eCSDataSet.Label.Clear();
			labelTableAdapter.Fill(eCSDataSet.Label);
			labelItemTableAdapter.Fill(eCSDataSet.LabelItem);
			foreach (ECSDataSet.LabelItemRow item in eCSDataSet.LabelItem)
			{
				item.Display = GetDisplay(item);
			}
			eCSDataSet.LabelItem.AcceptChanges();
			labelBindingSource.ResetBindings(metadataChanged: false);
			labelItemBindingSource.ResetBindings(metadataChanged: false);
			NoCTRowChanged = false;
		}
		if (Type == "Bitmap")
		{
			BitmapFuc.DataSet_Bitmap_Load_Sim(ref eCSDataSet, ref uIDataSet);
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "LabelForm");
	}

	private void LabelForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_PrintFormat");
		alignLabel.Text = Program.GetLang("pw_Snap_sl_");
		angleLabel.Text = Program.GetLang("pw_Angle_sl_");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		cloneToolStripButton.Text = Program.GetLang("pw_Clone");
		cloneToolStripButton2.Text = Program.GetLang("pw_Clone");
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_SubID");
		dataGridViewTextBoxColumn4.HeaderText = Program.GetLang("pw_Sort");
		dataGridViewTextBoxColumn5.HeaderText = Program.GetLang("pw_Name");
		Display.HeaderText = Program.GetLang("pw_Name");
		flagLabel.Text = Program.GetLang("pw_Name") + ":";
		fontLabel.Text = Program.GetLang("pw_Font_sl_");
		heightLabel.Text = Program.GetLang("pw_Height_sl_");
		heightLabel1.Text = Program.GetLang("pw_Height_sl_");
		label_ViewOnly1.Text = Program.GetLang("pw_ViewOnly");
		label_ViewOnly2.Text = string.Format(Program.GetLang("pw_CustomIDmustbetween10_29"), Settings.Default.minUserLabelID, Settings.Default.maxUserLabelID);
		label_ViewOnly3.Text = Program.GetLang("pw_Clicktoaddnew");
		label_ViewOnly4.Text = Program.GetLang("pw_Clicktocloneone");
		labelIDLabel.Text = Program.GetLang("pw_Number") + ":";
		leftLabel.Text = Program.GetLang("pw_Horizon_sl_");
		nameLabel.Text = Program.GetLang("pw_Name") + ":";
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		printLabel.Text = Program.GetLang("pw_Print_sl_");
		sortLabel.Text = Program.GetLang("pw_Sort") + ":";
		toolStripButton1.Text = Program.GetLang("pw_AddNew");
		toolStripButton2.Text = Program.GetLang("pw_Delete");
		toolStripButton3.Text = Program.GetLang("pw_FirstRecord");
		toolStripButton4.Text = Program.GetLang("pw_PreviousRecord");
		toolStripButton5.Text = Program.GetLang("pw_NextRecord");
		toolStripButton6.Text = Program.GetLang("pw_LastRecord");
		topLabel.Text = Program.GetLang("pw_Vertical_sl_");
		VersionColumn.HeaderText = Program.GetLang("pw_Version");
		versionLabel.Text = Program.GetLang("pw_Version") + ":";
		widthLabel.Text = Program.GetLang("pw_Width_sl_");
		widthLabel1.Text = Program.GetLang("pw_Width_sl_");
		Font = Settings.Default.CustomFont;
		if (Program.right != Program.Right.SuperAdmin)
		{
			labelBindingSource.Filter = "LabelID >= 1";
		}
		SetStyle(ControlStyles.ResizeRedraw | ControlStyles.SupportsTransparentBackColor, value: true);
		string fileName = Application.StartupPath + "\\Combo.xml";
		uIDataSet.Label_Sort.ReadXml(fileName);
		uIDataSet.LabelItem_Align.ReadXml(fileName);
		uIDataSet.LabelItem_Angle.ReadXml(fileName);
		uIDataSet.LabelItem_Font1.ReadXml(fileName);
		uIDataSet.LabelItem_Font2.ReadXml(fileName);
		uIDataSet.LabelItem_Print.ReadXml(fileName);
		uIDataSet.Label_Version.ReadXml(fileName);
		string fileName2 = Application.StartupPath + "\\LabelItem.xml";
		uIDataSet.ReadXml(fileName2);
		DataSet_Refresh("Bitmap");
		labelTableAdapter.Fill(eCSDataSet.Label);
		labelItemTableAdapter.Fill(eCSDataSet.LabelItem);
		foreach (ECSDataSet.LabelItemRow item in eCSDataSet.LabelItem)
		{
			item.Display = GetDisplay(item);
		}
		eCSDataSet.LabelItem.AcceptChanges();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow != null && !currentRow.IsVersionNull())
		{
			if (currentRow.Version == 0)
			{
				labelItemFontBindingSource.DataMember = "LabelItem_Font1";
			}
			else if (currentRow.Version == 1)
			{
				labelItemFontBindingSource.DataMember = "LabelItem_Font2";
			}
		}
		eCSDataSet.Label.ColumnChanging += Label_ColumnChanging;
		eCSDataSet.LabelItem.ColumnChanging += LabelItem_ColumnChanging;
		eCSDataSet.Label.LabelRowChanged += Label_LabelRowChanged;
		foreach (DataGridViewRow item2 in (IEnumerable)labelItemDataGridView.Rows)
		{
			item2.Selected = false;
		}
	}

	private void Label_LabelRowChanged(object sender, ECSDataSet.LabelRowChangeEvent e)
	{
		if (NoCTRowChanged || NewAdding || e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		if (e.Row.LabelID > Settings.Default.maxLabelID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		if (e.Row.LabelID < Settings.Default.minUserLabelID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		try
		{
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private int LabelItem_Pos(ECSDataSet.LabelItemRow row)
	{
		int num = row.Left + 1;
		if (num > 9999)
		{
			num = 9999;
		}
		else if (num < 1)
		{
			num = 1;
		}
		if (row.Flag1 == 5)
		{
			return row.Top * 10000;
		}
		if (row.Angle == 2 || row.Angle == 3)
		{
			return row.Top * 10000 - num;
		}
		return row.Top * 10000 + num;
	}

	public void SaveData()
	{
		Validate();
		DataSet_Changed = false;
		try
		{
			labelBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelBindingSource.CancelEdit();
		}
		try
		{
			labelItemBindingSource.EndEdit();
		}
		catch (Exception ex2)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelItemBindingSource.CancelEdit();
		}
		if (!eCSDataSet.HasChanges())
		{
			return;
		}
		if (Settings.Default.fucLabelReID)
		{
			foreach (ECSDataSet.LabelRow item in eCSDataSet.Label)
			{
				if (item.RowState == DataRowState.Deleted || item.RowState == DataRowState.Detached)
				{
					continue;
				}
				ECSDataSet.LabelItemRow[] labelItemRows = item.GetLabelItemRows();
				bool flag = false;
				for (int i = 0; i < labelItemRows.Length; i++)
				{
					if (labelItemRows[i].RowState != DataRowState.Deleted && labelItemRows[i].RowState != DataRowState.Detached && labelItemRows[i].Flag1 == 5)
					{
						flag = true;
						break;
					}
				}
				if (!flag)
				{
					continue;
				}
				for (int j = 0; j < labelItemRows.Length - 1; j++)
				{
					if (labelItemRows[j].RowState == DataRowState.Deleted || labelItemRows[j].RowState == DataRowState.Detached)
					{
						continue;
					}
					int num = j;
					int subID = labelItemRows[j].SubID;
					int num2 = j;
					int num3 = LabelItem_Pos(labelItemRows[j]);
					for (int k = j + 1; k < labelItemRows.Length; k++)
					{
						if (labelItemRows[k].RowState != DataRowState.Deleted && labelItemRows[k].RowState != DataRowState.Detached)
						{
							if (LabelItem_Pos(labelItemRows[k]) < num3)
							{
								num2 = k;
								num3 = LabelItem_Pos(labelItemRows[k]);
							}
							if (labelItemRows[k].SubID < subID)
							{
								num = k;
								subID = labelItemRows[k].SubID;
							}
						}
					}
					if (num2 != j)
					{
						object[] itemArray = labelItemRows[j].ItemArray;
						object[] itemArray2 = labelItemRows[num2].ItemArray;
						object obj = itemArray[1];
						itemArray[1] = itemArray2[1];
						itemArray2[1] = obj;
						labelItemRows[num2].ItemArray = itemArray;
						labelItemRows[j].ItemArray = itemArray2;
					}
					if (num != j)
					{
						int subID2 = labelItemRows[num].SubID;
						int subID3 = labelItemRows[j].SubID;
						subid_changing = true;
						labelItemRows[j].SubID = -1;
						labelItemRows[num].SubID = subID3;
						labelItemRows[j].SubID = subID2;
						subid_changing = false;
					}
				}
			}
		}
		try
		{
			labelTableAdapter.Update(eCSDataSet.Label);
			labelItemTableAdapter.Update(eCSDataSet.LabelItem);
		}
		catch (Exception ex3)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex3.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void LabelForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		Select(directed: true, forward: true);
		SaveData();
		base.Leave -= LabelForm_Leave;
		eCSDataSet.Label.LabelRowChanged -= Label_LabelRowChanged;
		eCSDataSet.Label.ColumnChanging -= Label_ColumnChanging;
		eCSDataSet.LabelItem.ColumnChanging -= LabelItem_ColumnChanging;
	}

	private void LabelItem_ColumnChanging(object sender, DataColumnChangeEventArgs e)
	{
		if (NewAdding || (e.Column.Caption != "SubID" && e.Column.Caption != "LabelID"))
		{
			return;
		}
		if (e.Column.Caption == "SubID")
		{
			int num = (int)e.ProposedValue;
			if ((num > Settings.Default.maxLabelItemID || num < 0) && !subid_changing)
			{
				e.ProposedValue = e.Row["SubID"];
			}
		}
		else if (e.Column.Caption == "LabelID")
		{
			int num2 = (int)e.ProposedValue;
			if ((num2 > Settings.Default.maxLabelID || num2 < Settings.Default.minUserLabelID) && Program.right == Program.Right.User)
			{
				e.ProposedValue = e.Row["LabelID"];
			}
		}
		try
		{
			labelItemTableAdapter.Update(eCSDataSet.LabelItem);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void Label_ColumnChanging(object sender, DataColumnChangeEventArgs e)
	{
		if (NewAdding)
		{
			return;
		}
		if (((int)e.Row["LabelID"] < Settings.Default.minUserLabelID || (int)e.Row["LabelID"] > Settings.Default.maxLabelID) && Program.right == Program.Right.User)
		{
			e.ProposedValue = e.Row[e.Column.Caption];
		}
		else if (!(e.Column.Caption != "LabelID"))
		{
			int num = (int)e.ProposedValue;
			if ((num > Settings.Default.maxLabelID || num < Settings.Default.minUserLabelID) && Program.right == Program.Right.User)
			{
				e.ProposedValue = e.Row["LabelID"];
			}
			try
			{
				labelTableAdapter.Update(eCSDataSet.Label);
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private ECSDataSet.LabelItemRow GetCurrentItemRow()
	{
		if (labelItemBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)labelItemBindingSource.Current;
		return (ECSDataSet.LabelItemRow)dataRowView.Row;
	}

	private ECSDataSet.LabelRow GetCurrentRow()
	{
		if (labelBindingSource.Position == -1)
		{
			return null;
		}
		DataRowView dataRowView = (DataRowView)labelBindingSource.Current;
		return (ECSDataSet.LabelRow)dataRowView.Row;
	}

	private void comboBox_Format(object sender, ListControlConvertEventArgs e)
	{
		DataRowView dataRowView = (DataRowView)e.ListItem;
		if (dataRowView != null)
		{
			e.Value = string.Format("{0} - {1}", dataRowView["Value"], dataRowView["Display"]);
		}
	}

	private string GetDisplay(ECSDataSet.LabelItemRow row)
	{
		int flag = row.Flag1;
		int flag2 = row.Flag2;
		int flag3 = row.Flag3;
		UIDataSet.LabelItem_Flag1Row labelItem_Flag1Row = uIDataSet.LabelItem_Flag1.FindByFlag1(flag);
		string text = ((labelItem_Flag1Row == null) ? string.Empty : labelItem_Flag1Row.Display);
		UIDataSet.LabelItem_Flag2Row labelItem_Flag2Row = uIDataSet.LabelItem_Flag2.FindByFlag1Flag2(flag, flag2);
		string text2 = ((labelItem_Flag2Row == null) ? string.Empty : labelItem_Flag2Row.Display);
		UIDataSet.LabelItem_Flag3Row labelItem_Flag3Row = uIDataSet.LabelItem_Flag3.FindByFlag1Flag3(flag, flag3);
		string text3 = ((labelItem_Flag3Row == null) ? string.Empty : labelItem_Flag3Row.Display);
		UIDataSet.LabelItem_Flag4Row labelItem_Flag4Row = uIDataSet.LabelItem_Flag4.FindByFlag1Flag2Flag4(flag, flag2, flag3);
		string text4 = ((labelItem_Flag4Row == null) ? string.Empty : labelItem_Flag4Row.Display);
		switch (flag)
		{
		case 2:
		case 4:
		case 5:
		case 6:
			return text + " - " + text2;
		case 0:
		case 1:
			return text + " - " + text2 + " - " + text3;
		case 3:
		{
			if (flag2 < 0 || flag2 > 31)
			{
				return string.Empty;
			}
			ECSDataSet.LabelRow labelRow = row.LabelRow;
			string result = "";
			try
			{
				result = (string)labelRow["Text" + (flag2 + 1)];
			}
			catch (Exception)
			{
			}
			return result;
		}
		case 7:
			return text + " - " + text2 + " - " + text4;
		default:
			return string.Empty;
		}
	}

	private void DrawItem(Graphics g, ECSDataSet.LabelRow row, ECSDataSet.LabelItemRow itemRow, bool current)
	{
		if (itemRow.Flag1 == 5)
		{
			using (Pen pen = new Pen(Color.Black, (!current) ? 1 : 2))
			{
				g.DrawLine(pen, new Point(0, itemRow.Top), new Point(row.Width, itemRow.Top));
			}
			if (current)
			{
				rcCur = new Rectangle(0, itemRow.Top - 5, row.Width, 10);
				rcLeftTop = (rcLeftBottom = (rcRightTop = (rcRightBottom = (rcLeft = (rcRight = (rcTop = (rcBottom = Rectangle.Empty)))))));
			}
			return;
		}
		g.TranslateTransform(itemRow.Left, itemRow.Top);
		float angle = 0f;
		switch (itemRow.Angle)
		{
		case 1:
			angle = 90f;
			break;
		case 2:
			angle = 180f;
			break;
		case 3:
			angle = 270f;
			break;
		}
		g.RotateTransform(angle);
		Rectangle rect = new Rectangle(0, 0, itemRow.Width, itemRow.Height);
		g.FillRectangle(Brushes.WhiteSmoke, rect);
		g.DrawRectangle(Pens.Black, rect);
		FontFamily fontFamily = Font.FontFamily;
		float emSize = Font.Size;
		if (!row.IsVersionNull())
		{
			if (row.Version == 0)
			{
				UIDataSet.LabelItem_Font1Row labelItem_Font1Row = uIDataSet.LabelItem_Font1.FindByValue(itemRow.Font);
				if (labelItem_Font1Row != null)
				{
					emSize = labelItem_Font1Row.Size;
				}
			}
			else if (row.Version == 1)
			{
				UIDataSet.LabelItem_Font2Row labelItem_Font2Row = uIDataSet.LabelItem_Font2.FindByValue(itemRow.Font);
				if (labelItem_Font2Row != null)
				{
					emSize = labelItem_Font2Row.Size;
				}
			}
		}
		Font font = new Font(fontFamily, emSize);
		StringFormat stringFormat = new StringFormat();
		switch (itemRow.Align)
		{
		case 1:
			stringFormat.Alignment = StringAlignment.Near;
			stringFormat.LineAlignment = StringAlignment.Near;
			break;
		case 2:
			stringFormat.Alignment = StringAlignment.Center;
			stringFormat.LineAlignment = StringAlignment.Near;
			break;
		case 3:
			stringFormat.Alignment = StringAlignment.Far;
			stringFormat.LineAlignment = StringAlignment.Near;
			break;
		case 4:
			stringFormat.Alignment = StringAlignment.Near;
			stringFormat.LineAlignment = StringAlignment.Center;
			break;
		case 0:
		case 5:
			stringFormat.Alignment = StringAlignment.Center;
			stringFormat.LineAlignment = StringAlignment.Center;
			break;
		case 6:
			stringFormat.Alignment = StringAlignment.Far;
			stringFormat.LineAlignment = StringAlignment.Center;
			break;
		case 7:
			stringFormat.Alignment = StringAlignment.Near;
			stringFormat.LineAlignment = StringAlignment.Far;
			break;
		case 8:
			stringFormat.Alignment = StringAlignment.Center;
			stringFormat.LineAlignment = StringAlignment.Far;
			break;
		case 9:
			stringFormat.Alignment = StringAlignment.Far;
			stringFormat.LineAlignment = StringAlignment.Far;
			break;
		}
		string display = itemRow.Display;
		g.DrawString(display, font, Brushes.Black, new RectangleF(0f, 0f, itemRow.Width, itemRow.Height), stringFormat);
		if (current)
		{
			int left = itemRow.Left;
			int top = itemRow.Top;
			int num = itemRow.Width;
			int num2 = itemRow.Height;
			rcCur = GetRealRect(new Rectangle(left, top, num, num2), itemRow.Angle);
			rcLeftTop = new Rectangle(rcCur.Left - 5, rcCur.Top - 5, 6, 6);
			rcLeftBottom = new Rectangle(rcCur.Left - 5, rcCur.Bottom - 1, 6, 6);
			rcRightTop = new Rectangle(rcCur.Right - 1, rcCur.Top - 5, 6, 6);
			rcRightBottom = new Rectangle(rcCur.Right - 1, rcCur.Bottom - 1, 6, 6);
			rcLeft = new Rectangle(rcCur.Left - 5, rcCur.Top + rcCur.Height / 2 - 2, 6, 6);
			rcRight = new Rectangle(rcCur.Right - 1, rcCur.Top + rcCur.Height / 2 - 2, 6, 6);
			rcTop = new Rectangle(rcCur.Left + rcCur.Width / 2 - 2, rcCur.Top - 5, 6, 6);
			rcBottom = new Rectangle(rcCur.Left + rcCur.Width / 2 - 2, rcCur.Bottom - 1, 6, 6);
			g.FillRectangle(Brushes.Black, new Rectangle(num - 1, -5, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(-5, -5, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(-5, num2 - 1, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(num - 1, num2 - 1, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(-5, num2 / 2 - 2, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(num - 1, num2 / 2 - 2, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(num / 2 - 2, -5, 6, 6));
			g.FillRectangle(Brushes.Black, new Rectangle(num / 2 - 2, num2 - 1, 6, 6));
		}
		g.ResetTransform();
	}

	private void subPanel_Paint(object sender, PaintEventArgs e)
	{
		Graphics graphics = e.Graphics;
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null)
		{
			subPanel.Width = 360;
			subPanel.Height = 270;
			graphics.Clear(Color.Gray);
			return;
		}
		subPanel.Width = currentRow.Width;
		subPanel.Height = currentRow.Height;
		graphics.Clear(Color.White);
		graphics.SmoothingMode = SmoothingMode.HighQuality;
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		foreach (DataRowView item in labelItemBindingSource)
		{
			ECSDataSet.LabelItemRow labelItemRow = (ECSDataSet.LabelItemRow)item.Row;
			if (labelItemRow.RowState == DataRowState.Detached || labelItemRow.RowState == DataRowState.Deleted || labelItemRow == currentItemRow)
			{
				continue;
			}
			DataGridViewRow dataGridViewRow = null;
			foreach (DataGridViewRow item2 in (IEnumerable)labelItemDataGridView.Rows)
			{
				if (item2.DataBoundItem is DataRowView dataRowView2 && labelItemRow.SubID == (int)dataRowView2.Row.ItemArray[1])
				{
					dataGridViewRow = item2;
					break;
				}
			}
			DrawItem(graphics, currentRow, labelItemRow, dataGridViewRow?.Selected ?? false);
		}
		if (currentItemRow != null)
		{
			DrawItem(graphics, currentRow, currentItemRow, current: true);
		}
		if (_dragState == DragState.Select && (_diffX != 0 || _diffY != 0))
		{
			Rectangle rect = RT_all(_ptStart.X, _ptStart.Y, _diffX, _diffY);
			Pen pen = new Pen(Color.Black);
			float[] dashPattern = new float[2] { 2f, 3f };
			pen.DashPattern = dashPattern;
			graphics.DrawRectangle(pen, rect);
		}
		rcLabelBottom = new Rectangle(currentRow.Width / 2 - 2, currentRow.Height - 5, 5, 5);
		rcLabelRight = new Rectangle(currentRow.Width - 5, currentRow.Height / 2 - 2, 5, 5);
		rcLabelRightBottom = new Rectangle(currentRow.Width - 5, currentRow.Height - 5, 5, 5);
		graphics.FillRectangle(Brushes.Black, rcLabelBottom);
		graphics.FillRectangle(Brushes.Black, rcLabelRight);
		graphics.FillRectangle(Brushes.Black, rcLabelRightBottom);
	}

	private void subPanel_MouseDown(object sender, MouseEventArgs e)
	{
		labelItemDataGridView.Focus();
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null)
		{
			return;
		}
		if (rcLabelBottom.Contains(e.X, e.Y))
		{
			_dragState = DragState.LabelBottom;
			_labelHeight = currentRow.Height;
		}
		else if (rcLabelRight.Contains(e.X, e.Y))
		{
			_dragState = DragState.LabelRight;
			_labelWidth = currentRow.Width;
		}
		else if (rcLabelRightBottom.Contains(e.X, e.Y))
		{
			_dragState = DragState.LabelRightBottom;
			_labelWidth = currentRow.Width;
			_labelHeight = currentRow.Height;
		}
		else
		{
			if (currentItemRow == null)
			{
				return;
			}
			if (rcLeftTop.Contains(e.X, e.Y))
			{
				_dragState = DragState.LeftTop;
			}
			else if (rcRightBottom.Contains(e.X, e.Y))
			{
				_dragState = DragState.RightBottom;
			}
			else if (rcLeftBottom.Contains(e.X, e.Y))
			{
				_dragState = DragState.LeftBottom;
			}
			else if (rcRightTop.Contains(e.X, e.Y))
			{
				_dragState = DragState.RightTop;
			}
			else if (rcLeft.Contains(e.X, e.Y))
			{
				_dragState = DragState.Left;
			}
			else if (rcRight.Contains(e.X, e.Y))
			{
				_dragState = DragState.Right;
			}
			else if (rcTop.Contains(e.X, e.Y))
			{
				_dragState = DragState.Top;
			}
			else if (rcBottom.Contains(e.X, e.Y))
			{
				_dragState = DragState.Bottom;
			}
			else
			{
				if (!rcCur.Contains(e.X, e.Y))
				{
					currentItemRow = null;
					_list.Clear();
					foreach (DataGridViewRow selectedRow in labelItemDataGridView.SelectedRows)
					{
						_list.Add((int)selectedRow.Cells[0].Value);
					}
					foreach (DataRowView item in labelItemBindingSource)
					{
						ECSDataSet.LabelItemRow labelItemRow = (ECSDataSet.LabelItemRow)item.Row;
						if (labelItemRow.RowState != DataRowState.Detached && labelItemRow.RowState != DataRowState.Deleted && _list.Contains(labelItemRow.SubID) && ((labelItemRow.Flag1 != 5) ? GetRealRect(new Rectangle(labelItemRow.Left, labelItemRow.Top, labelItemRow.Width, labelItemRow.Height), labelItemRow.Angle) : new Rectangle(0, labelItemRow.Top - 5, currentRow.Width, 10)).Contains(e.X, e.Y))
						{
							currentItemRow = labelItemRow;
							_list_ct = currentItemRow.SubID;
							break;
						}
					}
					if (currentItemRow == null)
					{
						foreach (DataRowView item2 in labelItemBindingSource)
						{
							ECSDataSet.LabelItemRow labelItemRow2 = (ECSDataSet.LabelItemRow)item2.Row;
							if (labelItemRow2.RowState != DataRowState.Detached && labelItemRow2.RowState != DataRowState.Deleted && ((labelItemRow2.Flag1 != 5) ? GetRealRect(new Rectangle(labelItemRow2.Left, labelItemRow2.Top, labelItemRow2.Width, labelItemRow2.Height), labelItemRow2.Angle) : new Rectangle(0, labelItemRow2.Top - 5, currentRow.Width, 10)).Contains(e.X, e.Y))
							{
								currentItemRow = labelItemRow2;
								_list_ct = currentItemRow.SubID;
								if (!bMulti_C && !bMulti_S)
								{
									_list.Clear();
								}
								break;
							}
						}
					}
					if (currentItemRow != null)
					{
						PropertyDescriptorCollection itemProperties = labelItemBindingSource.CurrencyManager.GetItemProperties();
						int num = labelItemBindingSource.Find(itemProperties["SubID"], currentItemRow.SubID);
						if (num <= -1)
						{
							return;
						}
						labelItemBindingSource.Position = num;
						_dragState = DragState.Move;
						(sender as Control).Cursor = Cursors.SizeAll;
						if (!bMulti_C && !bMulti_S)
						{
							foreach (DataGridViewRow item3 in (IEnumerable)labelItemDataGridView.Rows)
							{
								if ((int)item3.Cells[0].Value == currentItemRow.SubID)
								{
									item3.Selected = true;
								}
								else
								{
									item3.Selected = false;
								}
							}
						}
						_bIsDrag = true;
						_ptStart = new Point(e.X, e.Y);
						_left = currentItemRow.Left;
						_top = currentItemRow.Top;
						_width = currentItemRow.Width;
						_height = currentItemRow.Height;
						_labelWidth = currentRow.Width;
						_labelHeight = currentRow.Height;
					}
					else
					{
						_dragState = DragState.Select;
						_bIsDrag = true;
						_ptStart = new Point(e.X, e.Y);
					}
					return;
				}
				_dragState = DragState.Move;
				(sender as Control).Cursor = Cursors.SizeAll;
				_list_ct = currentItemRow.SubID;
				_list.Clear();
				foreach (DataGridViewRow item4 in (IEnumerable)labelItemDataGridView.Rows)
				{
					if (item4.Selected)
					{
						_list.Add((int)item4.Cells[0].Value);
					}
				}
			}
		}
		_bIsDrag = true;
		subPanel.Capture = true;
		if (currentItemRow != null)
		{
			_left = currentItemRow.Left;
			_top = currentItemRow.Top;
			_width = currentItemRow.Width;
			_height = currentItemRow.Height;
		}
		_ptStart = new Point(e.X, e.Y);
	}

	private Rectangle RT_all(int x, int y, int w, int h)
	{
		if (w < 0)
		{
			x += w;
			w = -w;
		}
		if (h < 0)
		{
			y += h;
			h = -h;
		}
		return new Rectangle(x, y, w, h);
	}

	private void subPanel_MouseUp(object sender, MouseEventArgs e)
	{
		if (_dragState == DragState.Select)
		{
			if (!bMulti_C && !bMulti_S)
			{
				bool flag = false;
				Rectangle rectangle = RT_all(_ptStart.X, _ptStart.Y, _diffX, _diffY);
				foreach (DataGridViewRow item in (IEnumerable)labelItemDataGridView.Rows)
				{
					if (!(item.DataBoundItem is DataRowView dataRowView))
					{
						continue;
					}
					ECSDataSet.LabelItemRow labelItemRow = dataRowView.Row as ECSDataSet.LabelItemRow;
					Rectangle rect;
					if (labelItemRow.Flag1 == 5)
					{
						rect = new Rectangle(0, labelItemRow.Top - 1, labelItemRow.Width, 2);
					}
					else
					{
						int w;
						int h;
						if (labelItemRow.Angle == 0)
						{
							w = labelItemRow.Width;
							h = labelItemRow.Height;
						}
						else if (labelItemRow.Angle == 1)
						{
							w = -labelItemRow.Height;
							h = labelItemRow.Width;
						}
						else if (labelItemRow.Angle == 2)
						{
							w = -labelItemRow.Width;
							h = -labelItemRow.Height;
						}
						else
						{
							w = labelItemRow.Height;
							h = -labelItemRow.Width;
						}
						rect = RT_all(labelItemRow.Left, labelItemRow.Top, w, h);
					}
					if (rectangle.IntersectsWith(rect))
					{
						item.Selected = true;
						if (!flag)
						{
							flag = true;
							PropertyDescriptorCollection itemProperties = labelItemBindingSource.CurrencyManager.GetItemProperties();
							int num = labelItemBindingSource.Find(itemProperties["SubID"], ((DataRowView)item.DataBoundItem).Row.ItemArray[1]);
							if (num > -1)
							{
								labelItemBindingSource.Position = num;
							}
						}
					}
					else
					{
						item.Selected = false;
					}
				}
				if (!flag)
				{
					int subID = GetCurrentItemRow().SubID;
					foreach (DataGridViewRow item2 in (IEnumerable)labelItemDataGridView.Rows)
					{
						if ((int)item2.Cells[0].Value == subID)
						{
							item2.Selected = true;
						}
						else
						{
							item2.Selected = false;
						}
					}
				}
			}
		}
		else if (bMulti_C || bMulti_S)
		{
			if (_list.Count != 0)
			{
				if (_list.Count == 1)
				{
					if (!_list.Contains(_list_ct))
					{
						foreach (DataGridViewRow item3 in (IEnumerable)labelItemDataGridView.Rows)
						{
							if (item3.DataBoundItem is DataRowView dataRowView2)
							{
								_ = dataRowView2.Row;
								if (_list_ct == (int)dataRowView2.Row.ItemArray[1] || _list.Contains((int)dataRowView2.Row.ItemArray[1]))
								{
									item3.Selected = true;
								}
								else
								{
									item3.Selected = false;
								}
							}
						}
					}
				}
				else if (_list.Contains(_list_ct))
				{
					PropertyDescriptorCollection itemProperties2 = labelItemBindingSource.CurrencyManager.GetItemProperties();
					int num2 = ((_list[0] != _list_ct) ? labelItemBindingSource.Find(itemProperties2["SubID"], _list[0]) : labelItemBindingSource.Find(itemProperties2["SubID"], _list[1]));
					if (num2 > -1)
					{
						labelItemBindingSource.Position = num2;
					}
					foreach (DataGridViewRow item4 in (IEnumerable)labelItemDataGridView.Rows)
					{
						if (item4.DataBoundItem is DataRowView dataRowView3)
						{
							_ = dataRowView3.Row;
							if (_list_ct != (int)dataRowView3.Row.ItemArray[1] && _list.Contains((int)dataRowView3.Row.ItemArray[1]))
							{
								item4.Selected = true;
							}
							else
							{
								item4.Selected = false;
							}
						}
					}
				}
				else
				{
					foreach (DataGridViewRow item5 in (IEnumerable)labelItemDataGridView.Rows)
					{
						if (item5.DataBoundItem is DataRowView dataRowView4)
						{
							_ = dataRowView4.Row;
							if (_list_ct == (int)dataRowView4.Row.ItemArray[1] || _list.Contains((int)dataRowView4.Row.ItemArray[1]))
							{
								item5.Selected = true;
							}
							else
							{
								item5.Selected = false;
							}
						}
					}
				}
			}
		}
		else
		{
			foreach (DataGridViewRow item6 in (IEnumerable)labelItemDataGridView.Rows)
			{
				if (item6.DataBoundItem is DataRowView dataRowView5)
				{
					_ = dataRowView5.Row;
					if (_list_ct == (int)dataRowView5.Row.ItemArray[1] || _list.Contains((int)dataRowView5.Row.ItemArray[1]))
					{
						item6.Selected = true;
					}
					else
					{
						item6.Selected = false;
					}
				}
			}
		}
		_list.Clear();
		_list_ct = -1;
		subPanel.Capture = false;
		_bIsDrag = false;
		_diffX = (_diffY = 0);
		subPanel.Invalidate();
	}

	private void subPanel_MouseMove_check(int Vin, char A, ref int Vout, int limit)
	{
		if (A == '+')
		{
			if (limit >= 0)
			{
				if (Vin + Vout < limit)
				{
					Vout = -Vin + limit;
				}
			}
			else if (Vin + Vout > -limit)
			{
				Vout = -Vin - limit;
			}
		}
		else if (limit >= 0)
		{
			if (Vin - Vout < limit)
			{
				Vout = Vin - limit;
			}
		}
		else if (Vin - Vout > -limit)
		{
			Vout = Vin + limit;
		}
	}

	private void subPanel_MouseMove_check(int Vin, char A, ref int Vout)
	{
		subPanel_MouseMove_check(Vin, A, ref Vout, 0);
	}

	private void multiItem_move(int diffX, int diffY, ECSDataSet.LabelRow row)
	{
		foreach (DataGridViewRow item in (IEnumerable)labelItemDataGridView.Rows)
		{
			if (!(item.DataBoundItem is DataRowView dataRowView) || (_list_ct != (int)dataRowView.Row.ItemArray[1] && !_list.Contains((int)dataRowView.Row.ItemArray[1])))
			{
				continue;
			}
			ECSDataSet.LabelItemRow labelItemRow = dataRowView.Row as ECSDataSet.LabelItemRow;
			if (labelItemRow.Flag1 == 5)
			{
				if (diffY < -labelItemRow.Top)
				{
					diffY = -labelItemRow.Top;
				}
				if (diffY > row.Height - labelItemRow.Top)
				{
					diffY = row.Height - labelItemRow.Top;
				}
			}
			else if (labelItemRow.Angle == 0)
			{
				if (diffX < -labelItemRow.Left)
				{
					diffX = -labelItemRow.Left;
				}
				if (diffX > row.Width - labelItemRow.Left - labelItemRow.Width)
				{
					diffX = row.Width - labelItemRow.Left - labelItemRow.Width;
				}
				if (diffY < -labelItemRow.Top)
				{
					diffY = -labelItemRow.Top;
				}
				if (diffY > row.Height - labelItemRow.Top - labelItemRow.Height)
				{
					diffY = row.Height - labelItemRow.Top - labelItemRow.Height;
				}
			}
			else if (labelItemRow.Angle == 1)
			{
				if (diffX < -(labelItemRow.Left - labelItemRow.Height))
				{
					diffX = -(labelItemRow.Left - labelItemRow.Height);
				}
				if (diffX > row.Width - labelItemRow.Left)
				{
					diffX = row.Width - labelItemRow.Left;
				}
				if (diffY < -labelItemRow.Top)
				{
					diffY = -labelItemRow.Top;
				}
				if (diffY > row.Height - labelItemRow.Top - labelItemRow.Width)
				{
					diffY = row.Height - labelItemRow.Top - labelItemRow.Width;
				}
			}
			else if (labelItemRow.Angle == 2)
			{
				if (diffX < -(labelItemRow.Left - labelItemRow.Width))
				{
					diffX = -(labelItemRow.Left - labelItemRow.Width);
				}
				if (diffX > row.Width - labelItemRow.Left)
				{
					diffX = row.Width - labelItemRow.Left;
				}
				if (diffY < -(labelItemRow.Top - labelItemRow.Height))
				{
					diffY = -(labelItemRow.Top - labelItemRow.Height);
				}
				if (diffY > row.Height - labelItemRow.Top)
				{
					diffY = row.Height - labelItemRow.Top;
				}
			}
			else if (labelItemRow.Angle == 3)
			{
				if (diffX < -labelItemRow.Left)
				{
					diffX = -labelItemRow.Left;
				}
				if (diffX > row.Width - labelItemRow.Left - labelItemRow.Height)
				{
					diffX = row.Width - labelItemRow.Left - labelItemRow.Height;
				}
				if (diffY < -(labelItemRow.Top - labelItemRow.Width))
				{
					diffY = -(labelItemRow.Top - labelItemRow.Width);
				}
				if (diffY > row.Height - labelItemRow.Top)
				{
					diffY = row.Height - labelItemRow.Top;
				}
			}
		}
		foreach (DataGridViewRow item2 in (IEnumerable)labelItemDataGridView.Rows)
		{
			if (item2.DataBoundItem is DataRowView dataRowView2 && (_list_ct == (int)dataRowView2.Row.ItemArray[1] || _list.Contains((int)dataRowView2.Row.ItemArray[1])))
			{
				ECSDataSet.LabelItemRow labelItemRow2 = dataRowView2.Row as ECSDataSet.LabelItemRow;
				if (labelItemRow2.Flag1 != 5)
				{
					labelItemRow2.Left += diffX;
				}
				labelItemRow2.Top += diffY;
				item2.Selected = true;
			}
		}
	}

	private void subPanel_MouseMove(object sender, MouseEventArgs e)
	{
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (_bIsDrag)
		{
			if (currentItemRow == null)
			{
				return;
			}
			int Vout = (_diffX = e.X - _ptStart.X);
			int Vout2 = (_diffY = e.Y - _ptStart.Y);
			int left = 0;
			int top = 0;
			int num = 0;
			int num2 = 0;
			if (currentItemRow != null)
			{
				left = currentItemRow.Left;
				top = currentItemRow.Top;
				num = currentItemRow.Width;
				num2 = currentItemRow.Height;
			}
			switch (_dragState)
			{
			case DragState.Move:
				Vout -= currentItemRow.Left - _left;
				Vout2 -= currentItemRow.Top - _top;
				if (_list.Contains(_list_ct))
				{
					_list.Remove(_list_ct);
				}
				multiItem_move(Vout, Vout2, currentRow);
				break;
			case DragState.LeftTop:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width - Vout;
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height - Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, -_left);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width - Vout2;
					currentItemRow.Height = _height - Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout, -_left);
					subPanel_MouseMove_check(_height, '-', ref Vout2, -_top);
					currentItemRow.Width = _width - Vout;
					currentItemRow.Height = _height - Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout2, -_top);
					currentItemRow.Width = _width - Vout2;
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height - Vout;
					break;
				}
				break;
			case DragState.RightBottom:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '+', ref Vout, -_labelWidth + _left);
					subPanel_MouseMove_check(_height, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Width = _width + Vout;
					currentItemRow.Height = _height + Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					subPanel_MouseMove_check(_width, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Width = _width + Vout2;
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height + Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width + Vout;
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height + Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, -_labelWidth + _left);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width + Vout2;
					currentItemRow.Height = _height + Vout;
					break;
				}
				break;
			case DragState.LeftBottom:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width - Vout;
					currentItemRow.Height = _height + Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, -_left);
					subPanel_MouseMove_check(_width, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Width = _width + Vout2;
					currentItemRow.Height = _height - Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout, -_left);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Width = _width - Vout;
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height + Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width + Vout2;
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height - Vout;
					break;
				}
				break;
			case DragState.RightTop:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '+', ref Vout, -_labelWidth + _left);
					currentItemRow.Width = _width + Vout;
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height - Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width - Vout2;
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height + Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					subPanel_MouseMove_check(_height, '-', ref Vout2, -_top);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width + Vout;
					currentItemRow.Height = _height - Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, -_labelWidth + _left);
					subPanel_MouseMove_check(_width, '-', ref Vout2, -_top);
					currentItemRow.Width = _width - Vout2;
					currentItemRow.Height = _height + Vout;
					break;
				}
				break;
			case DragState.Left:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width - Vout;
					break;
				case 1:
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout, -_left);
					currentItemRow.Height = _height - Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_width, '-', ref Vout, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout, -_left);
					currentItemRow.Width = _width - Vout;
					break;
				case 3:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '-', ref Vout, 8);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height - Vout;
					break;
				}
				break;
			case DragState.Right:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_width, '+', ref Vout, -_labelWidth + _left);
					currentItemRow.Width = _width + Vout;
					break;
				case 1:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Height = _height + Vout;
					break;
				case 2:
					subPanel_MouseMove_check(_left, '+', ref Vout);
					subPanel_MouseMove_check(_width, '+', ref Vout, 8);
					subPanel_MouseMove_check(_left, '+', ref Vout, -_labelWidth);
					currentItemRow.Left = _left + Vout;
					currentItemRow.Width = _width + Vout;
					break;
				case 3:
					subPanel_MouseMove_check(_height, '+', ref Vout, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout, -_labelWidth + _left);
					currentItemRow.Height = _height + Vout;
					break;
				}
				break;
			case DragState.Top:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height - Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width - Vout2;
					break;
				case 2:
					subPanel_MouseMove_check(_height, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '-', ref Vout2, -_top);
					currentItemRow.Height = _height - Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_width, '-', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '-', ref Vout2, -_top);
					currentItemRow.Width = _width - Vout2;
					break;
				}
				break;
			case DragState.Bottom:
				switch (currentItemRow.Angle)
				{
				case 0:
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_height, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Height = _height + Vout2;
					break;
				case 1:
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_width, '+', ref Vout2, -_labelHeight + _top);
					currentItemRow.Width = _width + Vout2;
					break;
				case 2:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_height, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Height = _height + Vout2;
					break;
				case 3:
					subPanel_MouseMove_check(_top, '+', ref Vout2);
					subPanel_MouseMove_check(_width, '+', ref Vout2, 8);
					subPanel_MouseMove_check(_top, '+', ref Vout2, -_labelHeight);
					currentItemRow.Top = _top + Vout2;
					currentItemRow.Width = _width + Vout2;
					break;
				}
				break;
			case DragState.LabelBottom:
				currentRow.Height = (_labelHeight + Vout2 + 7) / 8 * 8;
				break;
			case DragState.LabelRight:
				currentRow.Width = (_labelWidth + Vout + 7) / 8 * 8;
				break;
			case DragState.LabelRightBottom:
				currentRow.Height = (_labelHeight + Vout2 + 7) / 8 * 8;
				currentRow.Width = (_labelWidth + Vout + 7) / 8 * 8;
				break;
			}
			if (currentItemRow != null)
			{
				if (currentItemRow.Flag1 == 5)
				{
					currentItemRow.Left = left;
					currentItemRow.Width = num;
					currentItemRow.Height = num2;
					if (currentItemRow.Top < 0 || currentItemRow.Top > currentRow.Height)
					{
						currentItemRow.Top = top;
					}
				}
				else
				{
					Rectangle realRect = GetRealRect(new Rectangle(currentItemRow.Left, currentItemRow.Top, currentItemRow.Width, currentItemRow.Height), currentItemRow.Angle);
					if (realRect.Left < 0 || realRect.Left + realRect.Width > currentRow.Width || realRect.Top < 0 || realRect.Top + realRect.Height > currentRow.Height || realRect.Width < 1 || realRect.Height < 1)
					{
						currentItemRow.Left = left;
						currentItemRow.Top = top;
						currentItemRow.Width = num;
						currentItemRow.Height = num2;
					}
				}
			}
			int val = 0;
			int val2 = 0;
			ECSDataSet.LabelItemRow[] labelItemRows = currentRow.GetLabelItemRows();
			foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
			{
				if (labelItemRow.Flag1 == 5)
				{
					val2 = Math.Max(val2, labelItemRow.Top);
					continue;
				}
				Rectangle realRect2 = GetRealRect(new Rectangle(labelItemRow.Left, labelItemRow.Top, labelItemRow.Width, labelItemRow.Height), labelItemRow.Angle);
				val2 = Math.Max(val2, realRect2.Bottom);
				val = Math.Max(val, realRect2.Right);
			}
			currentRow.Width = Math.Max(Settings.Default.minLabelWidth, currentRow.Width);
			currentRow.Width = Math.Max(val, currentRow.Width);
			currentRow.Width = Math.Min(Settings.Default.maxLabelWidth, currentRow.Width);
			currentRow.Height = Math.Max(Settings.Default.minLabelHeight, currentRow.Height);
			currentRow.Height = Math.Max(val2, currentRow.Height);
			currentRow.Height = Math.Min(Settings.Default.maxLabelHeight, currentRow.Height);
			subPanel.Refresh();
		}
		else if (currentItemRow != null)
		{
			if (rcLeftTop.Contains(e.X, e.Y) || rcRightBottom.Contains(e.X, e.Y) || rcLabelRightBottom.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNWSE;
			}
			else if (rcLeftBottom.Contains(e.X, e.Y) || rcRightTop.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNESW;
			}
			else if (rcLeft.Contains(e.X, e.Y) || rcRight.Contains(e.X, e.Y) || rcLabelRight.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeWE;
			}
			else if (rcTop.Contains(e.X, e.Y) || rcBottom.Contains(e.X, e.Y) || rcLabelBottom.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNS;
			}
			else if (rcCur.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeAll;
			}
			else
			{
				(sender as Control).Cursor = Cursors.Arrow;
			}
		}
		else if (currentRow != null)
		{
			if (rcLabelRightBottom.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNWSE;
			}
			else if (rcLabelRight.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeWE;
			}
			else if (rcLabelBottom.Contains(e.X, e.Y))
			{
				(sender as Control).Cursor = Cursors.SizeNS;
			}
			else
			{
				(sender as Control).Cursor = Cursors.Arrow;
			}
		}
		else
		{
			(sender as Control).Cursor = Cursors.Arrow;
		}
	}

	private void alignButton_Click(object sender, EventArgs e)
	{
		using AlignForm alignForm = new AlignForm();
		if (alignForm.ShowDialog(this) == DialogResult.OK)
		{
			alignComboBox.SelectedIndex = alignForm.Align;
		}
	}

	private static Rectangle GetRealRect(Rectangle rc, int angle)
	{
		return angle switch
		{
			1 => new Rectangle(rc.Left - rc.Height, rc.Top, rc.Height, rc.Width), 
			2 => new Rectangle(rc.Left - rc.Width, rc.Top - rc.Height, rc.Width, rc.Height), 
			3 => new Rectangle(rc.Left, rc.Top - rc.Width, rc.Height, rc.Width), 
			_ => rc, 
		};
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length != 0)
		{
			int num = labelBindingSource.Find("LabelID", bindingNavigatorID.Text);
			if (num != -1)
			{
				labelBindingSource.Position = num;
			}
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(labelDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					labelBindingSource.Filter = filterForm.FilterString;
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
				}
				return;
			}
		}
		labelBindingSource.RemoveFilter();
	}

	private void NumericUpDown_ValueChanged_Div8(NumericUpDown V0, NumericUpDown V1)
	{
		int num = (int)(V1.Value + 7m) / 8;
		if ((decimal)(num * 8) != V1.Value)
		{
			V1.Value = num * 8;
		}
		V0.Value = num;
	}

	private void NumericUpDown_ValueChanged_Multi8(NumericUpDown V0, NumericUpDown V1)
	{
		int num = (int)Math.Ceiling(V1.Value);
		if ((decimal)num != V1.Value)
		{
			V1.Value = num;
		}
		V0.Value = num * 8;
	}

	private void NumericUpDown_ValueChanged_sDiv8(NumericUpDown V0, NumericUpDown V1)
	{
		V0.Value = V1.Value / 8m;
	}

	private void NumericUpDown_ValueChanged_sMulti8(NumericUpDown V0, NumericUpDown V1)
	{
		V0.Value = V1.Value * 8m;
	}

	private void NumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		if (sender == PPwidthNumericUpDown)
		{
			NumericUpDown_ValueChanged_Div8(PPwidthMMNumericUpDown, PPwidthNumericUpDown);
		}
		else if (sender == PPwidthMMNumericUpDown)
		{
			NumericUpDown_ValueChanged_Multi8(PPwidthNumericUpDown, PPwidthMMNumericUpDown);
		}
		else if (sender == PPheightNumericUpDown)
		{
			NumericUpDown_ValueChanged_Div8(PPheightMMNumericUpDown, PPheightNumericUpDown);
		}
		else if (sender == PPheightMMNumericUpDown)
		{
			NumericUpDown_ValueChanged_Multi8(PPheightNumericUpDown, PPheightMMNumericUpDown);
		}
		else if (sender == leftNumericUpDown)
		{
			NumericUpDown_ValueChanged_sDiv8(leftMMNumericUpDown, leftNumericUpDown);
		}
		else if (sender == leftMMNumericUpDown)
		{
			NumericUpDown_ValueChanged_sMulti8(leftNumericUpDown, leftMMNumericUpDown);
		}
		else if (sender == topNumericUpDown)
		{
			NumericUpDown_ValueChanged_sDiv8(topMMNumericUpDown, topNumericUpDown);
		}
		else if (sender == topMMNumericUpDown)
		{
			NumericUpDown_ValueChanged_sMulti8(topNumericUpDown, topMMNumericUpDown);
		}
		else if (sender == widthNumericUpDown)
		{
			NumericUpDown_ValueChanged_sDiv8(widthMMNumericUpDown, widthNumericUpDown);
		}
		else if (sender == widthMMNumericUpDown)
		{
			NumericUpDown_ValueChanged_sMulti8(widthNumericUpDown, widthMMNumericUpDown);
		}
		else if (sender == heightNumericUpDown)
		{
			NumericUpDown_ValueChanged_sDiv8(heightMMNumericUpDown, heightNumericUpDown);
		}
		else if (sender == heightMMNumericUpDown)
		{
			NumericUpDown_ValueChanged_sMulti8(heightNumericUpDown, heightMMNumericUpDown);
		}
	}

	private void labelItemBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch
			{
				bindingSource.CancelEdit();
			}
		}
		subPanel.Invalidate();
	}

	private void labelBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		labelItemBindingSource_BindingComplete(sender, e);
	}

	private void labelDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void toolStripButton1_Click(object sender, EventArgs e)
	{
		Validate();
		try
		{
			labelItemBindingSource.EndEdit();
			int num = -1;
			int num2 = -1;
			foreach (DataRowView item in labelItemBindingSource)
			{
				ECSDataSet.LabelItemRow labelItemRow = (ECSDataSet.LabelItemRow)item.Row;
				if (labelItemRow.SubID > num)
				{
					num = labelItemRow.SubID;
				}
			}
			PropertyDescriptorCollection itemProperties = labelItemBindingSource.CurrencyManager.GetItemProperties();
			int num3 = num + 1;
			if (num3 > Settings.Default.maxLabelItemID)
			{
				int i;
				for (i = 0; i <= Settings.Default.maxLabelItemID; i++)
				{
					num2 = labelItemBindingSource.Find(itemProperties["SubID"], i);
					if (num2 == -1)
					{
						num3 = i;
						break;
					}
				}
				if (i > Settings.Default.maxLabelItemID)
				{
					return;
				}
			}
			labelItemBindingSource.AddNew();
			GetCurrentItemRow().SubID = num3;
			fontComboBox.SelectedIndex = 0;
			labelItemBindingSource.EndEdit();
			num2 = labelItemBindingSource.Find(itemProperties["SubID"], num3);
			if (num2 != -1)
			{
				labelItemBindingSource.Position = num2;
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelItemBindingSource.CancelEdit();
		}
	}

	private void UpdateFlag()
	{
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		if (currentItemRow != null)
		{
			int flag = currentItemRow.Flag1;
			Label label = fontLabel;
			bool visible = (fontComboBox.Visible = flag != 0 && flag != 4 && flag != 5 && flag != 6);
			label.Visible = visible;
			Label label2 = alignLabel;
			ComboBox comboBox = alignComboBox;
			bool flag3 = (alignButton.Visible = flag != 4 && flag != 5);
			bool visible2 = (comboBox.Visible = flag3);
			label2.Visible = visible2;
			NumericUpDown numericUpDown = leftNumericUpDown;
			NumericUpDown numericUpDown2 = leftMMNumericUpDown;
			NumericUpDown numericUpDown3 = widthMMNumericUpDown;
			NumericUpDown numericUpDown4 = widthNumericUpDown;
			NumericUpDown numericUpDown5 = heightMMNumericUpDown;
			bool flag6 = (heightNumericUpDown.Enabled = flag != 5);
			bool flag8 = (numericUpDown5.Enabled = flag6);
			bool flag10 = (numericUpDown4.Enabled = flag8);
			bool flag12 = (numericUpDown3.Enabled = flag10);
			bool enabled = (numericUpDown2.Enabled = flag12);
			numericUpDown.Enabled = enabled;
			currentItemRow.Display = GetDisplay(currentItemRow);
		}
	}

	private void flagButton_Click(object sender, EventArgs e)
	{
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentItemRow == null || currentRow == null)
		{
			return;
		}
		using FlagForm flagForm = new FlagForm();
		flagForm.Flag1 = currentItemRow.Flag1;
		flagForm.Flag2 = currentItemRow.Flag2;
		flagForm.Flag3 = currentItemRow.Flag3;
		for (int i = 0; i < 32; i++)
		{
			try
			{
				flagForm.text[i] = (string)currentRow["Text" + (i + 1)];
			}
			catch
			{
				flagForm.text[i] = "";
			}
		}
		if (flagForm.ShowDialog(this) == DialogResult.OK)
		{
			currentItemRow.Flag1 = flagForm.Flag1;
			currentItemRow.Flag2 = flagForm.Flag2;
			currentItemRow.Flag3 = flagForm.Flag3;
			for (int j = 0; j < 32; j++)
			{
				currentRow["Text" + (j + 1)] = flagForm.text[j];
			}
			UpdateFlag();
		}
	}

	private void labelIDNumericUpDown_ValueChanged(object sender, EventArgs e)
	{
	}

	private void subPanel_MouseDoubleClick(object sender, MouseEventArgs e)
	{
		flagButton.PerformClick();
	}

	private void bindingNavigatorAddNewItem_Click(object sender, EventArgs e)
	{
		NewAdding = true;
		Validate();
		try
		{
			labelDataGridView.EndEdit();
			labelBindingSource.EndEdit();
			int availableLabelID = GetAvailableLabelID();
			if (availableLabelID != -1)
			{
				ECSDataSet.LabelRow labelRow = eCSDataSet.Label.NewLabelRow();
				labelRow.LabelID = availableLabelID;
				eCSDataSet.Label.AddLabelRow(labelRow);
				int num = labelBindingSource.Find("LabelID", availableLabelID);
				if (num != -1)
				{
					labelBindingSource.Position = num;
				}
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelBindingSource.CancelEdit();
		}
		finally
		{
			labelDataGridView.EndEdit();
			labelBindingSource.EndEdit();
			NewAdding = false;
		}
	}

	private void labelItemBindingSource_PositionChanged(object sender, EventArgs e)
	{
		UpdateFlag();
	}

	private void labelBindingSource_PositionChanged(object sender, EventArgs e)
	{
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null)
		{
			subPanel.Width = 360;
			subPanel.Height = 270;
			return;
		}
		subPanel.Width = currentRow.Width;
		subPanel.Height = currentRow.Height;
		if (!currentRow.IsVersionNull())
		{
			if (currentRow.Version == 0)
			{
				labelItemFontBindingSource.DataMember = "LabelItem_Font1";
			}
			else if (currentRow.Version == 1)
			{
				labelItemFontBindingSource.DataMember = "LabelItem_Font2";
			}
		}
		foreach (DataGridViewRow item in (IEnumerable)labelItemDataGridView.Rows)
		{
			if (item.Selected)
			{
				item.Selected = false;
			}
		}
	}

	private void versionComboBox_SelectionChangeCommitted(object sender, EventArgs e)
	{
		int num = (int)versionComboBox.SelectedValue;
		switch (num)
		{
		case 0:
			labelItemFontBindingSource.DataMember = "LabelItem_Font1";
			break;
		case 1:
			labelItemFontBindingSource.DataMember = "LabelItem_Font2";
			break;
		}
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow != null)
		{
			currentRow.Version = num;
			subPanel.Invalidate();
		}
	}

	private void cloneToolStripButton_Click(object sender, EventArgs e)
	{
		try
		{
			labelDataGridView.EndEdit();
			labelBindingSource.EndEdit();
			ECSDataSet.LabelRow currentRow = GetCurrentRow();
			if (currentRow == null)
			{
				return;
			}
			int availableLabelID = GetAvailableLabelID();
			if (availableLabelID != -1)
			{
				object[] itemArray = currentRow.ItemArray;
				itemArray[0] = availableLabelID;
				eCSDataSet.Label.Rows.Add(itemArray);
				int num = labelBindingSource.Find("LabelID", availableLabelID);
				if (num != -1)
				{
					labelBindingSource.Position = num;
				}
				ECSDataSet.LabelItemRow[] labelItemRows = currentRow.GetLabelItemRows();
				foreach (ECSDataSet.LabelItemRow labelItemRow in labelItemRows)
				{
					object[] itemArray2 = labelItemRow.ItemArray;
					itemArray2[0] = availableLabelID;
					eCSDataSet.LabelItem.Rows.Add(itemArray2);
				}
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelBindingSource.CancelEdit();
		}
	}

	private int GetAvailableLabelID()
	{
		int minUserLabelID = Settings.Default.minUserLabelID;
		for (int i = minUserLabelID; i <= Settings.Default.maxLabelID; i++)
		{
			ECSDataSet.LabelRow labelRow = eCSDataSet.Label.FindByLabelID(i);
			if (labelRow == null || (labelRow.RowState == DataRowState.Deleted && labelRow.RowState == DataRowState.Detached))
			{
				return i;
			}
		}
		return -1;
	}

	private void DeleteCurrent()
	{
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow == null || (Program.right == Program.Right.User && (currentRow.LabelID < Settings.Default.minUserLabelID || (currentRow.LabelID > Settings.Default.maxLabelID && currentRow.LabelID < Settings.Default.minLabelID_Recycled) || currentRow.LabelID > Settings.Default.maxLabelID_Recycled)))
		{
			return;
		}
		string arg = currentRow.LabelID.ToString();
		if (MessageBox.Show(this, string.Format(Program.GetLang("pw_Delete_0__"), arg), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.YesNo, MessageBoxIcon.Question, MessageBoxDefaultButton.Button2) == DialogResult.Yes)
		{
			labelDataGridView.Rows.Remove(labelDataGridView.CurrentRow);
			try
			{
				labelTableAdapter.Update(eCSDataSet.Label);
				labelItemTableAdapter.Update(eCSDataSet.LabelItem);
				DataSet_Changed = true;
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		DeleteCurrent();
	}

	private void bindingNavigatorKeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteCurrent();
		}
	}

	private void labelBindingSource_CurrentChanged(object sender, EventArgs e)
	{
		bool flag = false;
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		if (currentRow != null && currentRow.LabelID >= Settings.Default.minUserLabelID && currentRow.LabelID <= Settings.Default.maxLabelID)
		{
			flag = true;
		}
		if (Program.right != Program.Right.User)
		{
			flag = true;
		}
		SplitterPanel panel = splitContainer2.Panel1;
		bool enabled = (splitContainer3.Panel1.Enabled = flag);
		panel.Enabled = enabled;
		Edit_panel.Visible = flag;
		View_panel.Visible = !flag;
	}

	private void label_ViewOnly3_Click(object sender, EventArgs e)
	{
		bindingNavigatorAddNewItem_Click(sender, e);
	}

	private void label_ViewOnly4_Click(object sender, EventArgs e)
	{
		cloneToolStripButton_Click(sender, e);
	}

	private void labelItemBindingSource_DataSourceChanged(object sender, EventArgs e)
	{
		foreach (DataGridViewRow item in (IEnumerable)labelItemDataGridView.Rows)
		{
			item.Selected = false;
		}
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: true, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: true, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: false, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void cloneToolStripButton2_Click(object sender, EventArgs e)
	{
		Validate();
		try
		{
			labelItemBindingSource.EndEdit();
			int num = -1;
			int num2 = -1;
			foreach (DataRowView item in labelItemBindingSource)
			{
				ECSDataSet.LabelItemRow labelItemRow = (ECSDataSet.LabelItemRow)item.Row;
				if (labelItemRow.SubID > num)
				{
					num = labelItemRow.SubID;
				}
			}
			PropertyDescriptorCollection itemProperties = labelItemBindingSource.CurrencyManager.GetItemProperties();
			int num3 = num + 1;
			if (num3 > Settings.Default.maxLabelItemID)
			{
				int i;
				for (i = 0; i <= Settings.Default.maxLabelItemID; i++)
				{
					num2 = labelItemBindingSource.Find(itemProperties["SubID"], i);
					if (num2 == -1)
					{
						num3 = i;
						break;
					}
				}
				if (i > Settings.Default.maxLabelItemID)
				{
					return;
				}
			}
			ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
			if (currentItemRow != null)
			{
				object[] itemArray = currentItemRow.ItemArray;
				itemArray[1] = num3;
				labelItemBindingSource.AddNew();
				GetCurrentItemRow().ItemArray = itemArray;
				fontComboBox.SelectedIndex = 0;
				labelItemBindingSource.EndEdit();
				num2 = labelItemBindingSource.Find(itemProperties["SubID"], num3);
				if (num2 != -1)
				{
					labelItemBindingSource.Position = num2;
				}
			}
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			labelItemBindingSource.CancelEdit();
		}
	}

	private void LabelForm_Leave(object sender, EventArgs e)
	{
		labelDataGridView.EndEdit();
		labelBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			labelTableAdapter.Update(eCSDataSet.Label);
			labelItemTableAdapter.Update(eCSDataSet.LabelItem);
			DataSet_Update("Label");
			DataSet_Changed = false;
		}
	}

	private void labelItemDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if ((e.KeyCode & Keys.ShiftKey) == Keys.ShiftKey)
		{
			bMulti_S = true;
		}
		if ((e.KeyCode & Keys.ControlKey) == Keys.ControlKey)
		{
			bMulti_C = true;
		}
		if (e.KeyCode != Keys.Left && e.KeyCode != Keys.Right && e.KeyCode != Keys.Up && e.KeyCode != Keys.Down)
		{
			return;
		}
		ECSDataSet.LabelItemRow currentItemRow = GetCurrentItemRow();
		ECSDataSet.LabelRow currentRow = GetCurrentRow();
		_list_ct = currentItemRow.SubID;
		_list.Clear();
		foreach (DataGridViewRow item in (IEnumerable)labelItemDataGridView.Rows)
		{
			if (item.Selected)
			{
				_list.Add((int)item.Cells[0].Value);
			}
		}
		if (e.KeyCode == Keys.Left)
		{
			multiItem_move(-1, 0, currentRow);
		}
		else if (e.KeyCode == Keys.Right)
		{
			multiItem_move(1, 0, currentRow);
		}
		else if (e.KeyCode == Keys.Up)
		{
			multiItem_move(0, -1, currentRow);
		}
		else if (e.KeyCode == Keys.Down)
		{
			multiItem_move(0, 1, currentRow);
		}
		e.Handled = true;
	}

	private void labelItemDataGridView_KeyUp(object sender, KeyEventArgs e)
	{
		if ((e.KeyCode & Keys.ShiftKey) == Keys.ShiftKey)
		{
			bMulti_S = false;
		}
		if ((e.KeyCode & Keys.ControlKey) == Keys.ControlKey)
		{
			bMulti_C = false;
		}
	}
}
